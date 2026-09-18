package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"live-polling-app/backend/config"
	"live-polling-app/backend/database"
	"live-polling-app/backend/handlers"
	"live-polling-app/backend/repository"
	"live-polling-app/backend/routes"
	"live-polling-app/backend/services"
	"live-polling-app/backend/websocket"
)

func main() {
	log.Println("==================================================")
	log.Println("       PulsePoll - Live Polling Go Backend       ")
	log.Println("==================================================")

	// 1. Load Environment Configuration
	cfg := config.LoadConfig()

	// 2. Connect to MongoDB
	mongoDB, err := database.ConnectMongoDB(cfg.MongoURI, cfg.MongoDBName)
	if err != nil {
		log.Fatalf("Fatal: Failed to connect to MongoDB: %v", err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		mongoDB.Close(ctx)
	}()

	// 3. Connect to Redis
	redisClient, err := database.ConnectRedis(cfg.RedisURL)
	if err != nil {
		log.Fatalf("Fatal: Failed to connect to Redis: %v", err)
	}

	// 4. Initialize Repositories
	userRepo := repository.NewUserRepository(mongoDB)
	pollRepo := repository.NewPollRepository(mongoDB)

	// 5. Initialize WebSocket Realtime Hub
	wsHub := websocket.NewHub()
	go wsHub.Run()

	// 6. Initialize Business Logic Services
	authService := services.NewAuthService(userRepo, cfg)
	pollService := services.NewPollService(pollRepo, redisClient)
	voteService := services.NewVoteService(pollRepo, pollService, redisClient, wsHub)

	// 7. Initialize HTTP Handlers
	authHandler := handlers.NewAuthHandler(authService)
	pollHandler := handlers.NewPollHandler(pollService, voteService)
	wsHandler := handlers.NewWSHandler(wsHub)

	// 8. Setup Gin Router
	router := routes.SetupRouter(cfg, authHandler, pollHandler, wsHandler)

	// 9. Start HTTP Server with Graceful Shutdown
	addr := fmt.Sprintf(":%s", cfg.Port)
	srv := &http.Server{
		Addr:    addr,
		Handler: router,
	}

	go func() {
		log.Printf("PulsePoll Server listening on http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server listen error: %v", err)
		}
	}()

	// Listen for OS signals for graceful termination
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down PulsePoll server gracefully...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced shutdown: %v", err)
	}

	log.Println("PulsePoll server stopped.")
}
