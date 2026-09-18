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
)

type UserRepository struct {
	db          *database.MongoDB
	collection  *mongo.Collection
	memoryUsers map[string]*models.User
	mu          sync.RWMutex
}

func NewUserRepository(db *database.MongoDB) *UserRepository {
	var coll *mongo.Collection
	if db.IsConnected && db.Database != nil {
		coll = db.Database.Collection("users")
	}
	return &UserRepository{
		db:          db,
		collection:  coll,
		memoryUsers: make(map[string]*models.User),
	}
}

func (r *UserRepository) CreateUser(ctx context.Context, user *models.User) error {
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	if r.db.IsConnected && r.collection != nil {
		user.ID = primitive.NewObjectID()
		_, err := r.collection.InsertOne(ctx, user)
		if err != nil {
			return err
		}
		return nil
	}

	// Memory Fallback
	r.mu.Lock()
	defer r.mu.Unlock()
	if user.ID.IsZero() {
		user.ID = primitive.NewObjectID()
	}
	r.memoryUsers[user.Email] = user
	return nil
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	if r.db.IsConnected && r.collection != nil {
		var user models.User
		err := r.collection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
		if err != nil {
			if errors.Is(err, mongo.ErrNoDocuments) {
				return nil, errors.New("user not found")
			}
			return nil, err
		}
		return &user, nil
	}

	// Memory Fallback
	r.mu.RLock()
	defer r.mu.RUnlock()
	if user, exists := r.memoryUsers[email]; exists {
		return user, nil
	}
	return nil, errors.New("user not found")
}

func (r *UserRepository) FindByID(ctx context.Context, id primitive.ObjectID) (*models.User, error) {
	if r.db.IsConnected && r.collection != nil {
		var user models.User
		err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
		if err != nil {
			return nil, err
		}
		return &user, nil
	}

	// Memory Fallback
	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, user := range r.memoryUsers {
		if user.ID == id {
			return user, nil
		}
	}
	return nil, errors.New("user not found")
}
