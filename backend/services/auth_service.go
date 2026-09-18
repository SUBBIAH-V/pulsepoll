package services

import (
	"context"
	"errors"
	"strings"

	"live-polling-app/backend/config"
	"live-polling-app/backend/models"
	"live-polling-app/backend/repository"
	"live-polling-app/backend/utils"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AuthService struct {
	userRepo *repository.UserRepository
	cfg      *config.Config
}

func NewAuthService(userRepo *repository.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		cfg:      cfg,
	}
}

func (s *AuthService) Signup(ctx context.Context, req *models.SignupRequest) (*models.AuthResponse, error) {
	// 1. Backend Validations
	if strings.TrimSpace(req.Name) == "" {
		return nil, errors.New("name is required")
	}
	if strings.TrimSpace(req.Email) == "" {
		return nil, errors.New("email is required")
	}
	if req.Password != req.ConfirmPassword {
		return nil, errors.New("passwords do not match")
	}
	if len(req.Password) < 6 {
		return nil, errors.New("password must be at least 6 characters long")
	}

	cleanEmail := strings.ToLower(strings.TrimSpace(req.Email))

	// 2. Duplicate email detection
	existingUser, _ := s.userRepo.FindByEmail(ctx, cleanEmail)
	if existingUser != nil {
		return nil, errors.New("email already registered")
	}

	// 3. Bcrypt Password Hashing
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// 4. Create User Record
	user := &models.User{
		Name:         strings.TrimSpace(req.Name),
		Email:        cleanEmail,
		PasswordHash: hashedPassword,
	}

	if err := s.userRepo.CreateUser(ctx, user); err != nil {
		return nil, err
	}

	// 5. Generate JWT Token
	token, err := utils.GenerateJWT(user.ID.Hex(), user.Email, s.cfg.JWTSecret, s.cfg.JWTExpirationHours)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		Token: token,
		User: models.UserResponse{
			ID:        user.ID.Hex(),
			Name:      user.Name,
			Email:     user.Email,
			CreatedAt: user.CreatedAt,
		},
	}, nil
}

func (s *AuthService) Login(ctx context.Context, req *models.LoginRequest) (*models.AuthResponse, error) {
	cleanEmail := strings.ToLower(strings.TrimSpace(req.Email))

	user, err := s.userRepo.FindByEmail(ctx, cleanEmail)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	// Verify Bcrypt Hash
	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		return nil, errors.New("invalid email or password")
	}

	// Generate JWT
	token, err := utils.GenerateJWT(user.ID.Hex(), user.Email, s.cfg.JWTSecret, s.cfg.JWTExpirationHours)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		Token: token,
		User: models.UserResponse{
			ID:        user.ID.Hex(),
			Name:      user.Name,
			Email:     user.Email,
			CreatedAt: user.CreatedAt,
		},
	}, nil
}

func (s *AuthService) GetProfile(ctx context.Context, userIDStr string) (*models.UserResponse, error) {
	objID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	user, err := s.userRepo.FindByID(ctx, objID)
	if err != nil {
		return nil, err
	}

	return &models.UserResponse{
		ID:        user.ID.Hex(),
		Name:      user.Name,
		Email:     user.Email,
		CreatedAt: user.CreatedAt,
	}, nil
}
