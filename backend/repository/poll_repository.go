package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"live-polling-app/backend/database"
	"live-polling-app/backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type PollRepository struct {
	db             *database.MongoDB
	pollsColl      *mongo.Collection
	votesColl      *mongo.Collection
	memoryPolls    map[string]*models.Poll
	memoryVoteRecs []*models.VoteRecord
	mu             sync.RWMutex
}

func NewPollRepository(db *database.MongoDB) *PollRepository {
	var pColl, vColl *mongo.Collection
	if db.IsConnected && db.Database != nil {
		pColl = db.Database.Collection("polls")
		vColl = db.Database.Collection("votes")
	}
	return &PollRepository{
		db:             db,
		pollsColl:      pColl,
		votesColl:      vColl,
		memoryPolls:    make(map[string]*models.Poll),
		memoryVoteRecs: make([]*models.VoteRecord, 0),
	}
}

func (r *PollRepository) CreatePoll(ctx context.Context, poll *models.Poll) error {
	poll.CreatedAt = time.Now()
	poll.UpdatedAt = time.Now()

	if r.db.IsConnected && r.pollsColl != nil {
		poll.ID = primitive.NewObjectID()
		_, err := r.pollsColl.InsertOne(ctx, poll)
		return err
	}

	// Memory Fallback
	r.mu.Lock()
	defer r.mu.Unlock()
	if poll.ID.IsZero() {
		poll.ID = primitive.NewObjectID()
	}
	r.memoryPolls[poll.ID.Hex()] = poll
	return nil
}

func (r *PollRepository) GetPollByID(ctx context.Context, idStr string) (*models.Poll, error) {
	cleanID := strings.TrimSpace(strings.ToLower(idStr))
	if cleanID == "" {
		return nil, errors.New("Poll ID or PIN code is required")
	}

	if r.db.IsConnected && r.pollsColl != nil {
		var poll models.Poll

		// 1. Direct PIN Code lookup (exact match e.g. "839102")
		err := r.pollsColl.FindOne(ctx, bson.M{"pinCode": cleanID}).Decode(&poll)
		if err == nil {
			return &poll, nil
		}

		// 2. Exact 24-character hex ObjectID lookup
		if objID, err := primitive.ObjectIDFromHex(cleanID); err == nil {
			err := r.pollsColl.FindOne(ctx, bson.M{"_id": objID}).Decode(&poll)
			if err == nil {
				return &poll, nil
			}
		}

		// 3. Prefix lookup on ObjectID string or PIN Code regex
		regexPattern := fmt.Sprintf("^%s", cleanID)
		opts := options.FindOne().SetSort(bson.M{"created_at": -1})
		err = r.pollsColl.FindOne(ctx, bson.M{
			"$or": []bson.M{
				{"pinCode": bson.M{"$regex": regexPattern, "$options": "i"}},
				{
					"$expr": bson.M{
						"$regexMatch": bson.M{
							"input":   bson.M{"$toString": "$_id"},
							"regex":   regexPattern,
							"options": "i",
						},
					},
				},
			},
		}, opts).Decode(&poll)

		if err == nil {
			return &poll, nil
		}

		return nil, errors.New("Poll not found. Please check your Poll ID or PIN Code.")
	}

	// Memory Fallback
	r.mu.RLock()
	defer r.mu.RUnlock()
	for k, p := range r.memoryPolls {
		if k == cleanID || p.PinCode == cleanID || strings.HasPrefix(strings.ToLower(k), cleanID) {
			return p, nil
		}
	}

	return nil, errors.New("Poll not found. Please check your Poll ID or PIN Code.")
}

func (r *PollRepository) GetMyPolls(ctx context.Context, userID string) ([]*models.Poll, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID format")
	}

	if r.db.IsConnected && r.pollsColl != nil {
		opts := options.Find().SetSort(bson.M{"created_at": -1})
		cursor, err := r.pollsColl.Find(ctx, bson.M{"created_by": userObjID}, opts)
		if err != nil {
			return nil, err
		}
		defer cursor.Close(ctx)

		var polls []*models.Poll
		if err := cursor.All(ctx, &polls); err != nil {
			return nil, err
		}
		return polls, nil
	}

	// Memory Fallback
	r.mu.RLock()
	defer r.mu.RUnlock()
	var polls []*models.Poll
	for _, p := range r.memoryPolls {
		if p.CreatedBy.Hex() == userID {
			polls = append(polls, p)
		}
	}
	return polls, nil
}

func (r *PollRepository) HasVoted(ctx context.Context, pollID string, voterIdentifier string) (bool, error) {
	if r.db.IsConnected && r.votesColl != nil {
		count, err := r.votesColl.CountDocuments(ctx, bson.M{
			"poll_id": pollID,
			"voter":   voterIdentifier,
		})
		if err != nil {
			return false, err
		}
		return count > 0, nil
	}

	// Memory Fallback
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, rec := range r.memoryVoteRecs {
		if rec.PollID == pollID && rec.VoterIdentifier == voterIdentifier {
			return true, nil
		}
	}
	return false, nil
}

func (r *PollRepository) RecordVote(ctx context.Context, record *models.VoteRecord) error {
	record.CreatedAt = time.Now()

	if r.db.IsConnected && r.votesColl != nil {
		_, err := r.votesColl.InsertOne(ctx, record)
		return err
	}

	// Memory Fallback
	r.mu.Lock()
	defer r.mu.Unlock()
	r.memoryVoteRecs = append(r.memoryVoteRecs, record)
	return nil
}

func (r *PollRepository) ClosePoll(ctx context.Context, pollID string) error {
	objID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return errors.New("invalid poll ID format")
	}

	if r.db.IsConnected && r.pollsColl != nil {
		_, err := r.pollsColl.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
			"$set": bson.M{
				"status":     "closed",
				"updated_at": time.Now(),
			},
		})
		return err
	}

	// Memory Fallback
	r.mu.Lock()
	defer r.mu.Unlock()
	if poll, exists := r.memoryPolls[pollID]; exists {
		poll.Status = "closed"
		poll.UpdatedAt = time.Now()
	}
	return nil
}

func (r *PollRepository) SetActiveQuestionIndex(ctx context.Context, pollID string, slideIndex int) error {
	objID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return errors.New("invalid poll ID format")
	}

	if r.db.IsConnected && r.pollsColl != nil {
		_, err := r.pollsColl.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
			"$set": bson.M{
				"active_question_index": slideIndex,
				"updated_at":            time.Now(),
			},
		})
		return err
	}

	// Memory Fallback
	r.mu.Lock()
	defer r.mu.Unlock()
	if poll, exists := r.memoryPolls[pollID]; exists {
		poll.ActiveQuestionIndex = slideIndex
		poll.UpdatedAt = time.Now()
	}
	return nil
}

func (r *PollRepository) SaveOpenResponse(ctx context.Context, pollID string, questionID string, response models.OpenResponse) error {
	objID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return errors.New("invalid poll ID format")
	}

	if r.db.IsConnected && r.pollsColl != nil {
		filter := bson.M{"_id": objID, "questions.id": questionID}
		update := bson.M{
			"$push": bson.M{"questions.$.responses": response},
			"$set":  bson.M{"updated_at": time.Now()},
		}
		_, err := r.pollsColl.UpdateOne(ctx, filter, update)
		return err
	}

	// Memory Fallback
	r.mu.Lock()
	defer r.mu.Unlock()
	if poll, exists := r.memoryPolls[pollID]; exists {
		for i, q := range poll.Questions {
			if q.ID == questionID {
				poll.Questions[i].Responses = append(poll.Questions[i].Responses, response)
				break
			}
		}
	}
	return nil
}

func (r *PollRepository) AddQAQuestion(ctx context.Context, pollID string, item models.QAItem) error {
	objID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return errors.New("invalid poll ID format")
	}

	if r.db.IsConnected && r.pollsColl != nil {
		filter := bson.M{"_id": objID}
		update := bson.M{
			"$push": bson.M{"audience_qa": item},
			"$set":  bson.M{"updated_at": time.Now()},
		}
		_, err := r.pollsColl.UpdateOne(ctx, filter, update)
		return err
	}

	// Memory Fallback
	r.mu.Lock()
	defer r.mu.Unlock()
	if poll, exists := r.memoryPolls[pollID]; exists {
		poll.AudienceQA = append(poll.AudienceQA, item)
	}
	return nil
}

func (r *PollRepository) UpvoteQAQuestion(ctx context.Context, pollID string, qaID string) error {
	objID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return errors.New("invalid poll ID format")
	}

	if r.db.IsConnected && r.pollsColl != nil {
		filter := bson.M{"_id": objID, "audience_qa.id": qaID}
		update := bson.M{
			"$inc": bson.M{"audience_qa.$.upvotes": 1},
			"$set": bson.M{"updated_at": time.Now()},
		}
		_, err := r.pollsColl.UpdateOne(ctx, filter, update)
		return err
	}

	// Memory Fallback
	r.mu.Lock()
	defer r.mu.Unlock()
	if poll, exists := r.memoryPolls[pollID]; exists {
		for i, item := range poll.AudienceQA {
			if item.ID == qaID {
				poll.AudienceQA[i].Upvotes++
				break
			}
		}
	}
	return nil
}
