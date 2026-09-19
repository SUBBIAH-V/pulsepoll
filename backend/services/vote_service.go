package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"live-polling-app/backend/database"
	"live-polling-app/backend/models"
	"live-polling-app/backend/repository"
	"live-polling-app/backend/websocket"
)

type VoteService struct {
	pollRepo    *repository.PollRepository
	pollService *PollService
	redisClient *database.RedisClient
	wsHub       *websocket.Hub
}

func NewVoteService(pollRepo *repository.PollRepository, pollService *PollService, redisClient *database.RedisClient, wsHub *websocket.Hub) *VoteService {
	return &VoteService{
		pollRepo:    pollRepo,
		pollService: pollService,
		redisClient: redisClient,
		wsHub:       wsHub,
	}
}

func (s *VoteService) SubmitVote(ctx context.Context, pollID string, req *models.VoteRequest, clientIP string) (*models.PollResultResponse, error) {
	// 1. Fetch Poll from MongoDB
	poll, err := s.pollRepo.GetPollByID(ctx, pollID)
	if err != nil {
		return nil, errors.New("poll not found")
	}

	canonicalID := poll.ID.Hex()

	// 2. Validate Poll Status & Expiration
	if poll.Status == "closed" || (poll.ExpiresAt != nil && time.Now().After(*poll.ExpiresAt)) {
		return nil, errors.New("this poll is closed or has expired")
	}

	// 3. Validate Option Existence (DO NOT trust option IDs from client blindly)
	validOption := false
	for _, opt := range poll.Options {
		if opt.ID == req.OptionID {
			validOption = true
			break
		}
	}

	if !validOption {
		for _, q := range poll.Questions {
			for _, opt := range q.Options {
				if opt.ID == req.OptionID {
					validOption = true
					break
				}
			}
			if validOption {
				break
			}
		}
	}

	if !validOption {
		return nil, errors.New("invalid poll option selected")
	}


	// 4. Anti-Duplicate Vote Check (Per-Question / Per-Slide)
	voterID := req.VoterID
	if voterID == "" {
		voterID = clientIP
	}

	qID := req.QuestionID
	if qID == "" {
		qID = "q1"
	}

	if voterID != "" {
		redisVoteKey := fmt.Sprintf("voted:%s:%s:%s", canonicalID, qID, voterID)
		alreadyVoted, _ := s.redisClient.Exists(ctx, redisVoteKey)
		if alreadyVoted {
			return nil, errors.New("you have already voted on this question")
		}

		hasVotedInMongo, _ := s.pollRepo.HasVoted(ctx, canonicalID, qID, voterID)
		if hasVotedInMongo {
			return nil, errors.New("you have already voted on this question")
		}

		// Mark voter key in Redis for 24 hours
		_ = s.redisClient.Set(ctx, redisVoteKey, "1", 24*time.Hour)
	}

	// 5. ATOMIC REDIS HINCRBY: Increment vote count for the selected option in Redis
	redisKey := fmt.Sprintf("poll:%s", canonicalID)
	newCount, err := s.redisClient.HIncrBy(ctx, redisKey, req.OptionID, 1)
	if err != nil {
		log.Printf("Warning: Failed to execute Redis HINCRBY: %v", err)
	} else {
		log.Printf("Redis HINCRBY poll:%s option:%s -> new count: %d", canonicalID, req.OptionID, newCount)
	}

	// 6. Save audit vote record to MongoDB asynchronously / persistently
	voteRecord := &models.VoteRecord{
		PollID:     poll.ID,
		QuestionID: qID,
		OptionID:   req.OptionID,
		VoterID:    voterID,
		IPAddress:  clientIP,
	}
	go func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = s.pollRepo.RecordVote(bgCtx, voteRecord)
	}()

	// 7. Get fresh aggregated poll results
	updatedResults, err := s.pollService.GetPollByID(ctx, canonicalID)
	if err != nil {
		return nil, err
	}

	// 8. BROADCAST TO ALL WEBSOCKET SUBSCRIBERS AUTOMATICALLY VIA REDIS PUB/SUB & HUB
	wsMessage := websocket.WSMessage{
		Type:       "poll_update",
		PollID:     pollID,
		Results:    updatedResults.Results,
		TotalVotes: updatedResults.TotalVotes,
	}

	// Publish to Redis Pub/Sub channel automatically
	if msgData, err := json.Marshal(wsMessage); err == nil {
		_ = s.redisClient.Publish(ctx, fmt.Sprintf("poll_events:%s", pollID), string(msgData))
	}

	// Broadcast directly to local WebSocket subscribers
	s.wsHub.BroadcastToPoll(pollID, wsMessage)

	return updatedResults, nil
}
