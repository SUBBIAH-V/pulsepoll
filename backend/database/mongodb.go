package database

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoDB struct {
	Client   *mongo.Client
	Database *mongo.Database
	IsConnected bool
}

func ConnectMongoDB(uri, dbName string) (*MongoDB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	log.Printf("Connecting to MongoDB at: %s ...", uri)
	clientOptions := options.Client().ApplyURI(uri)

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Printf("Warning: Unable to create MongoDB client: %v", err)
		return &MongoDB{IsConnected: false}, nil
	}

	// Ping the primary to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		log.Printf("Notice: Could not ping MongoDB (will use in-memory persistent fallback if needed): %v", err)
		return &MongoDB{Client: client, Database: client.Database(dbName), IsConnected: false}, nil
	}

	db := client.Database(dbName)
	log.Printf("Successfully connected to MongoDB database: %s", dbName)

	return &MongoDB{
		Client:      client,
		Database:    db,
		IsConnected: true,
	}, nil
}

func (m *MongoDB) Close(ctx context.Context) error {
	if m.Client != nil && m.IsConnected {
		return m.Client.Disconnect(ctx)
	}
	return nil
}
