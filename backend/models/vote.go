package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type VoteRecord struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PollID    primitive.ObjectID `bson:"pollId" json:"pollId"`
	OptionID  string             `bson:"optionId" json:"optionId"`
	VoterID   string             `bson:"voterId" json:"voterId"` // IP + UserAgent hash or session UUID
	IPAddress string             `bson:"ipAddress,omitempty" json:"ipAddress,omitempty"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
}
