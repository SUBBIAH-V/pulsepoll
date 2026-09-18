package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type QuestionType string

const (
	TypeMultipleChoice QuestionType = "multiple_choice"
	TypeOpenEnded      QuestionType = "open_ended"
)

type Option struct {
	ID    string `bson:"id" json:"id"`
	Text  string `bson:"text" json:"text"`
	Votes int64  `bson:"votes" json:"votes"`
}

type OpenResponse struct {
	ID        string    `bson:"id" json:"id"`
	Text      string    `bson:"text" json:"text"`
	VoterID   string    `bson:"voterId" json:"voterId"`
	CreatedAt time.Time `bson:"createdAt" json:"createdAt"`
}

type QuestionItem struct {
	ID        string         `bson:"id" json:"id"`
	Type      QuestionType   `bson:"type" json:"type"` // "multiple_choice" or "open_ended"
	Title     string         `bson:"title" json:"title"`
	Options   []Option       `bson:"options,omitempty" json:"options,omitempty"`
	Responses []OpenResponse `bson:"responses,omitempty" json:"responses,omitempty"`
}

type QAItem struct {
	ID        string    `bson:"id" json:"id"`
	Question  string    `bson:"question" json:"question"`
	AskedBy   string    `bson:"askedBy" json:"askedBy"`
	Upvotes   int64     `bson:"upvotes" json:"upvotes"`
	Upvoters  []string  `bson:"upvoters,omitempty" json:"upvoters,omitempty"`
	CreatedAt time.Time `bson:"createdAt" json:"createdAt"`
}

type Poll struct {
	ID                  primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PinCode             string             `bson:"pinCode" json:"pinCode"`
	Question            string             `bson:"question" json:"question"`
	Options             []Option           `bson:"options" json:"options"`
	Questions           []QuestionItem     `bson:"questions,omitempty" json:"questions,omitempty"`
	ActiveQuestionIndex int                `bson:"activeQuestionIndex" json:"activeQuestionIndex"`
	AudienceQA          []QAItem           `bson:"audienceQA,omitempty" json:"audienceQA,omitempty"`
	CreatedBy           primitive.ObjectID `bson:"createdBy" json:"createdBy"`
	Status              string             `bson:"status" json:"status"` // "active" or "closed"
	ExpiresAt           *time.Time         `bson:"expiresAt,omitempty" json:"expiresAt,omitempty"`
	CreatedAt           time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt           time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type CreateQuestionRequest struct {
	Title   string   `json:"title" binding:"required"`
	Type    string   `json:"type"` // "multiple_choice" or "open_ended"
	Options []string `json:"options"`
}

type CreatePollRequest struct {
	Question          string                  `json:"question"`
	Options           []string                `json:"options"`
	Questions         []CreateQuestionRequest `json:"questions"`
	ExpirationMinutes int                     `json:"expirationMinutes"` // 0 = no expiration
}

type VoteRequest struct {
	QuestionID string `json:"questionId"`
	OptionID   string `json:"optionId" binding:"required"`
	VoterID    string `json:"voterId"`
}

type SubmitOpenResponseRequest struct {
	QuestionID string `json:"questionId" binding:"required"`
	Text       string `json:"text" binding:"required"`
	VoterID    string `json:"voterId"`
}

type SubmitQARequest struct {
	Question string `json:"question" binding:"required"`
	AskedBy  string `json:"askedBy"`
	VoterID  string `json:"voterId"`
}

type UpvoteQARequest struct {
	VoterID string `json:"voterId" binding:"required"`
}

type SetActiveSlideRequest struct {
	SlideIndex int `json:"slideIndex"`
}

type PollResultResponse struct {
	PollID              string         `json:"pollId"`
	PinCode             string         `json:"pinCode"`
	Question            string         `json:"question"`
	Options             []Option       `json:"options"`
	Questions           []QuestionItem `json:"questions"`
	ActiveQuestionIndex int            `json:"activeQuestionIndex"`
	AudienceQA          []QAItem       `json:"audienceQA"`
	Status              string         `json:"status"`
	ExpiresAt           *time.Time     `json:"expiresAt,omitempty"`
	IsExpired           bool           `json:"isExpired"`
	Results             []OptionResult `json:"results"`
	TotalVotes          int64          `json:"totalVotes"`
}

type OptionResult struct {
	OptionID   string  `json:"optionId"`
	Text       string  `json:"text"`
	Votes      int64   `json:"votes"`
	Percentage float64 `json:"percentage"`
}

