package repository

import (
	"context"
	"errors"
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
	db              *database.MongoDB
	pollsColl       *mongo.Collection
	votesColl       *mongo.Collection
	memoryPolls     map[string]*models.Poll
	memoryVoteRecs  []*models.VoteRecord
	mu              sync.RWMutex
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
	objID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return nil, errors.New("invalid poll ID format")
	}

	if r.db.IsConnected && r.pollsColl != nil {
		var poll models.Poll
		err := r.pollsColl.FindOne(ctx, bson.M{"_id": objID}).Decode(&poll)
		if err != nil {
			if errors.Is(err, mongo.ErrNoDocuments) {
				return nil, errors.New("poll not found")
			}
			return nil, err
		}
		return &poll, nil
	}

	// Memory Fallback
	r.mu.RLock()
	defer r.mu.RUnlock()
	poll, exists := r.memoryPolls[idStr]
	if !exists {
		return nil, errors.New("poll not found")
	}
	return poll, nil
}

func (r *PollRepository) GetPollsByUserID(ctx context.Context, userID primitive.ObjectID) ([]*models.Poll, error) {
	if r.db.IsConnected && r.pollsColl != nil {
		opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
		cursor, err := r.pollsColl.Find(ctx, bson.M{"createdBy": userID}, opts)
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
	var userPolls []*models.Poll
	for _, poll := range r.memoryPolls {
		if poll.CreatedBy == userID {
			userPolls = append(userPolls, poll)
		}
	}
	return userPolls, nil
}

func (r *PollRepository) SaveVoteRecord(ctx context.Context, vote *models.VoteRecord) error {
	vote.CreatedAt = time.Now()
	if r.db.IsConnected && r.votesColl != nil {
		vote.ID = primitive.NewObjectID()
		_, err := r.votesColl.InsertOne(ctx, vote)
		return err
	}

	// Memory Fallback
	r.mu.Lock()
	defer r.mu.Unlock()
	vote.ID = primitive.NewObjectID()
	r.memoryVoteRecs = append(r.memoryVoteRecs, vote)
	return nil
}

func (r *PollRepository) HasVoted(ctx context.Context, pollID string, voterID string) (bool, error) {
	if voterID == "" {
		return false, nil
	}

	objID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return false, nil
	}

	if r.db.IsConnected && r.votesColl != nil {
		count, err := r.votesColl.CountDocuments(ctx, bson.M{
			"pollId":  objID,
			"voterId": voterID,
		})
		if err != nil {
			return false, err
		}
		return count > 0, nil
	}

	// Memory Fallback
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, v := range r.memoryVoteRecs {
		if v.PollID == objID && v.VoterID == voterID {
			return true, nil
		}
	}
	return false, nil
}

func (r *PollRepository) UpdatePollOptionVotes(ctx context.Context, pollID string, optionID string, increment int64) error {
	objID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return err
	}

	if r.db.IsConnected && r.pollsColl != nil {
		filter := bson.M{"_id": objID, "options.id": optionID}
		update := bson.M{"$inc": bson.M{"options.$.votes": increment}, "$set": bson.M{"updatedAt": time.Now()}}
		_, err := r.pollsColl.UpdateOne(ctx, filter, update)
		return err
	}

	// Memory Fallback
	r.mu.Lock()
	defer r.mu.Unlock()
	if poll, exists := r.memoryPolls[pollID]; exists {
		for i := range poll.Options {
			if poll.Options[i].ID == optionID {
				poll.Options[i].Votes += increment
				poll.UpdatedAt = time.Now()
				break
			}
		}
	}
	return nil
}

func (r *PollRepository) UpdatePollStatus(ctx context.Context, pollID string, status string) error {
	objID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return err
	}

	if r.db.IsConnected && r.pollsColl != nil {
		_, err := r.pollsColl.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": bson.M{"status": status, "updatedAt": time.Now()}})
		return err
	}

	// Memory Fallback
	r.mu.Lock()
	defer r.mu.Unlock()
	r.memoryPolls[pollID].Status = status
	r.memoryPolls[pollID].UpdatedAt = time.Now()
	return nil
}

func (r *PollRepository) SetActiveSlideIndex(ctx context.Context, pollID string, slideIndex int) error {
	objID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return err
	}

	if r.db.IsConnected && r.pollsColl != nil {
		_, err := r.pollsColl.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{"$set": bson.M{"activeQuestionIndex": slideIndex, "updatedAt": time.Now()}})
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	if poll, exists := r.memoryPolls[pollID]; exists {
		poll.ActiveQuestionIndex = slideIndex
		poll.UpdatedAt = time.Now()
	}
	return nil
}

func (r *PollRepository) AddOpenResponse(ctx context.Context, pollID string, questionID string, resp models.OpenResponse) error {
	objID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return err
	}

	if r.db.IsConnected && r.pollsColl != nil {
		filter := bson.M{"_id": objID, "questions.id": questionID}
		update := bson.M{
			"$push": bson.M{"questions.$.responses": resp},
			"$set":  bson.M{"updatedAt": time.Now()},
		}
		_, err := r.pollsColl.UpdateOne(ctx, filter, update)
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	if poll, exists := r.memoryPolls[pollID]; exists {
		for i := range poll.Questions {
			if poll.Questions[i].ID == questionID {
				poll.Questions[i].Responses = append(poll.Questions[i].Responses, resp)
				poll.UpdatedAt = time.Now()
				break
			}
		}
	}
	return nil
}

func (r *PollRepository) AddQAQuestion(ctx context.Context, pollID string, qa models.QAItem) error {
	objID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return err
	}

	if r.db.IsConnected && r.pollsColl != nil {
		_, err := r.pollsColl.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
			"$push": bson.M{"audienceQA": qa},
			"$set":  bson.M{"updatedAt": time.Now()},
		})
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	if poll, exists := r.memoryPolls[pollID]; exists {
		poll.AudienceQA = append(poll.AudienceQA, qa)
		poll.UpdatedAt = time.Now()
	}
	return nil
}

func (r *PollRepository) UpvoteQAQuestion(ctx context.Context, pollID string, qaID string, voterID string) error {
	objID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return err
	}

	if r.db.IsConnected && r.pollsColl != nil {
		filter := bson.M{"_id": objID, "audienceQA.id": qaID}
		update := bson.M{
			"$inc":      bson.M{"audienceQA.$.upvotes": 1},
			"$addToSet": bson.M{"audienceQA.$.upvoters": voterID},
			"$set":      bson.M{"updatedAt": time.Now()},
		}
		_, err := r.pollsColl.UpdateOne(ctx, filter, update)
		return err
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	if poll, exists := r.memoryPolls[pollID]; exists {
		for i := range poll.AudienceQA {
			if poll.AudienceQA[i].ID == qaID {
				poll.AudienceQA[i].Upvotes++
				poll.AudienceQA[i].Upvoters = append(poll.AudienceQA[i].Upvoters, voterID)
				poll.UpdatedAt = time.Now()
				break
			}
		}
	}
	return nil
}

