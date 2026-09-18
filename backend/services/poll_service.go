package services

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strconv"
	"time"

	"live-polling-app/backend/database"
	"live-polling-app/backend/models"
	"live-polling-app/backend/repository"
	"live-polling-app/backend/utils"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PollService struct {
	pollRepo *repository.PollRepository
	redisClient *database.RedisClient
}

func NewPollService(pollRepo *repository.PollRepository, redisClient *database.RedisClient) *PollService {
	return &PollService{
		pollRepo:    pollRepo,
		redisClient: redisClient,
	}
}

func (s *PollService) CreatePoll(ctx context.Context, userIDStr string, req *models.CreatePollRequest) (*models.Poll, error) {
	// 1. Backend validation
	if err := utils.ValidatePollRequest(req); err != nil {
		return nil, err
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	var questionItems []models.QuestionItem

	// 2. Build Questions list (Multi-question support + single fallback)
	if len(req.Questions) > 0 {
		for _, qReq := range req.Questions {
			qType := models.QuestionType(qReq.Type)
			if qType == "" {
				qType = models.TypeMultipleChoice
			}

			var opts []models.Option
			if qType == models.TypeMultipleChoice {
				for _, optText := range qReq.Options {
					opts = append(opts, models.Option{
						ID:    uuid.New().String()[:8],
						Text:  optText,
						Votes: 0,
					})
				}
			}

			questionItems = append(questionItems, models.QuestionItem{
				ID:        uuid.New().String()[:8],
				Type:      qType,
				Title:     qReq.Title,
				Options:   opts,
				Responses: []models.OpenResponse{},
			})
		}
	} else {
		// Single Question Fallback
		var options []models.Option
		for _, optText := range req.Options {
			options = append(options, models.Option{
				ID:    uuid.New().String()[:8],
				Text:  optText,
				Votes: 0,
			})
		}

		questionItems = append(questionItems, models.QuestionItem{
			ID:        uuid.New().String()[:8],
			Type:      models.TypeMultipleChoice,
			Title:     req.Question,
			Options:   options,
			Responses: []models.OpenResponse{},
		})
	}

	// First question legacy fallback fields
	firstQuestion := questionItems[0]

	// 3. Handle optional expiration
	var expiresAt *time.Time
	if req.ExpirationMinutes > 0 {
		exp := time.Now().Add(time.Duration(req.ExpirationMinutes) * time.Minute)
		expiresAt = &exp
	}

	poll := &models.Poll{
		Question:            firstQuestion.Title,
		Options:             firstQuestion.Options,
		Questions:           questionItems,
		ActiveQuestionIndex: 0,
		AudienceQA:          []models.QAItem{},
		CreatedBy:           userID,
		Status:              "active",
		ExpiresAt:           expiresAt,
	}

	// 4. Save to MongoDB
	if err := s.pollRepo.CreatePoll(ctx, poll); err != nil {
		return nil, fmt.Errorf("failed to create poll: %w", err)
	}

	// 5. Initialize Redis live count hash for all multiple choice options
	redisKey := fmt.Sprintf("poll:%s", poll.ID.Hex())
	redisValues := make([]interface{}, 0)
	for _, q := range questionItems {
		for _, opt := range q.Options {
			redisValues = append(redisValues, opt.ID, 0)
		}
	}
	if len(redisValues) > 0 {
		_ = s.redisClient.HSet(ctx, redisKey, redisValues...)
	}

	return poll, nil
}

func (s *PollService) GetPollByID(ctx context.Context, pollID string) (*models.PollResultResponse, error) {
	poll, err := s.pollRepo.GetPollByID(ctx, pollID)
	if err != nil {
		return nil, err
	}

	// Check poll expiration status
	isExpired := false
	if poll.ExpiresAt != nil && time.Now().After(*poll.ExpiresAt) {
		isExpired = true
		if poll.Status != "closed" {
			poll.Status = "closed"
		}
	}

	// Fetch LIVE vote counts from Redis
	redisKey := fmt.Sprintf("poll:%s", pollID)
	redisCounts, _ := s.redisClient.HGetAll(ctx, redisKey)

	var totalVotes int64 = 0

	// Build questions response with updated live option counts
	updatedQuestions := make([]models.QuestionItem, 0, len(poll.Questions))

	// Ensure at least 1 question item exists
	questionsSource := poll.Questions
	if len(questionsSource) == 0 {
		questionsSource = []models.QuestionItem{
			{
				ID:        "q1",
				Type:      models.TypeMultipleChoice,
				Title:     poll.Question,
				Options:   poll.Options,
				Responses: []models.OpenResponse{},
			},
		}
	}

	var legacyOptionResults []models.OptionResult

	for qIdx, q := range questionsSource {
		var updatedOptions []models.Option
		for _, opt := range q.Options {
			var votes int64 = opt.Votes
			if countStr, exists := redisCounts[opt.ID]; exists {
				if parsed, err := strconv.ParseInt(countStr, 10, 64); err == nil {
					votes = parsed
				}
			}
			totalVotes += votes
			updatedOptions = append(updatedOptions, models.Option{
				ID:    opt.ID,
				Text:  opt.Text,
				Votes: votes,
			})

			if qIdx == poll.ActiveQuestionIndex || (poll.ActiveQuestionIndex >= len(questionsSource) && qIdx == 0) {
				legacyOptionResults = append(legacyOptionResults, models.OptionResult{
					OptionID: opt.ID,
					Text:     opt.Text,
					Votes:    votes,
				})
			}
		}

		updatedQuestions = append(updatedQuestions, models.QuestionItem{
			ID:        q.ID,
			Type:      q.Type,
			Title:     q.Title,
			Options:   updatedOptions,
			Responses: q.Responses,
		})
	}

	// Calculate percentage for legacy option results
	for i := range legacyOptionResults {
		if totalVotes > 0 {
			pct := (float64(legacyOptionResults[i].Votes) / float64(totalVotes)) * 100.0
			legacyOptionResults[i].Percentage = math.Round(pct*10) / 10
		} else {
			legacyOptionResults[i].Percentage = 0.0
		}
	}

	// Determine active question title
	activeTitle := poll.Question
	if poll.ActiveQuestionIndex >= 0 && poll.ActiveQuestionIndex < len(updatedQuestions) {
		activeTitle = updatedQuestions[poll.ActiveQuestionIndex].Title
	}

	audienceQA := poll.AudienceQA
	if audienceQA == nil {
		audienceQA = []models.QAItem{}
	}

	return &models.PollResultResponse{
		PollID:              poll.ID.Hex(),
		Question:            activeTitle,
		Options:             poll.Options,
		Questions:           updatedQuestions,
		ActiveQuestionIndex: poll.ActiveQuestionIndex,
		AudienceQA:          audienceQA,
		Status:              poll.Status,
		ExpiresAt:           poll.ExpiresAt,
		IsExpired:           isExpired,
		Results:             legacyOptionResults,
		TotalVotes:          totalVotes,
	}, nil
}

func (s *PollService) SetActiveSlide(ctx context.Context, pollID string, slideIndex int, userIDStr string) (*models.PollResultResponse, error) {
	poll, err := s.pollRepo.GetPollByID(ctx, pollID)
	if err != nil {
		return nil, errors.New("poll not found")
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil || poll.CreatedBy != userID {
		return nil, errors.New("unauthorized: only creator can switch slides")
	}

	if err := s.pollRepo.SetActiveSlideIndex(ctx, pollID, slideIndex); err != nil {
		return nil, err
	}

	return s.GetPollByID(ctx, pollID)
}

func (s *PollService) SubmitOpenResponse(ctx context.Context, pollID string, req *models.SubmitOpenResponseRequest) (*models.PollResultResponse, error) {
	poll, err := s.pollRepo.GetPollByID(ctx, pollID)
	if err != nil {
		return nil, errors.New("poll not found")
	}

	if poll.Status == "closed" {
		return nil, errors.New("this poll is closed")
	}

	openResp := models.OpenResponse{
		ID:        uuid.New().String()[:8],
		Text:      req.Text,
		VoterID:   req.VoterID,
		CreatedAt: time.Now(),
	}

	if err := s.pollRepo.AddOpenResponse(ctx, pollID, req.QuestionID, openResp); err != nil {
		return nil, fmt.Errorf("failed to save response: %w", err)
	}

	return s.GetPollByID(ctx, pollID)
}

func (s *PollService) SubmitQAQuestion(ctx context.Context, pollID string, req *models.SubmitQARequest) (*models.PollResultResponse, error) {
	poll, err := s.pollRepo.GetPollByID(ctx, pollID)
	if err != nil {
		return nil, errors.New("poll not found")
	}

	if poll.Status == "closed" {
		return nil, errors.New("this poll is closed")
	}

	askedBy := req.AskedBy
	if askedBy == "" {
		askedBy = "Audience Member"
	}

	qaItem := models.QAItem{
		ID:        uuid.New().String()[:8],
		Question:  req.Question,
		AskedBy:   askedBy,
		Upvotes:   0,
		Upvoters:  []string{req.VoterID},
		CreatedAt: time.Now(),
	}

	if err := s.pollRepo.AddQAQuestion(ctx, pollID, qaItem); err != nil {
		return nil, fmt.Errorf("failed to submit question: %w", err)
	}

	return s.GetPollByID(ctx, pollID)
}

func (s *PollService) UpvoteQAQuestion(ctx context.Context, pollID string, qaID string, voterID string) (*models.PollResultResponse, error) {
	poll, err := s.pollRepo.GetPollByID(ctx, pollID)
	if err != nil {
		return nil, errors.New("poll not found")
	}

	// Check if user already upvoted this question
	for _, qa := range poll.AudienceQA {
		if qa.ID == qaID {
			for _, u := range qa.Upvoters {
				if u == voterID {
					return nil, errors.New("you have already upvoted this question")
				}
			}
		}
	}

	if err := s.pollRepo.UpvoteQAQuestion(ctx, pollID, qaID, voterID); err != nil {
		return nil, fmt.Errorf("failed to upvote: %w", err)
	}

	return s.GetPollByID(ctx, pollID)
}

func (s *PollService) GetMyPolls(ctx context.Context, userIDStr string) ([]*models.PollResultResponse, error) {
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	polls, err := s.pollRepo.GetPollsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	var results []*models.PollResultResponse
	for _, p := range polls {
		res, err := s.GetPollByID(ctx, p.ID.Hex())
		if err == nil {
			results = append(results, res)
		}
	}

	return results, nil
}

func (s *PollService) ClosePoll(ctx context.Context, pollID string, userIDStr string) (*models.PollResultResponse, error) {
	poll, err := s.pollRepo.GetPollByID(ctx, pollID)
	if err != nil {
		return nil, errors.New("poll not found")
	}

	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil || poll.CreatedBy != userID {
		return nil, errors.New("unauthorized: only the poll creator can close this poll")
	}

	if err := s.pollRepo.UpdatePollStatus(ctx, pollID, "closed"); err != nil {
		return nil, fmt.Errorf("failed to close poll: %w", err)
	}

	return s.GetPollByID(ctx, pollID)
}

