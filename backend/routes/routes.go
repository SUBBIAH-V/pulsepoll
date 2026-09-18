package routes

import (
	"live-polling-app/backend/config"
	"live-polling-app/backend/handlers"
	"live-polling-app/backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter(
	cfg *config.Config,
	authHandler *handlers.AuthHandler,
	pollHandler *handlers.PollHandler,
	wsHandler *handlers.WSHandler,
) *gin.Engine {
	r := gin.Default()

	// 1. CORS Middleware
	r.Use(middleware.CORSMiddleware(cfg.FrontendURL))

	// Healthcheck route
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "online",
			"app":    "PulsePoll Live Polling Backend",
		})
	})

	// 2. Public Auth Routes
	authGroup := r.Group("/api/auth")
	{
		authGroup.POST("/signup", authHandler.Signup)
		authGroup.POST("/login", authHandler.Login)
	}

	// 3. Protected Auth Routes
	authProtected := r.Group("/api/auth")
	authProtected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		authProtected.GET("/me", authHandler.GetMe)
	}

	// 4. Public Poll Routes (Viewing, Voting, Open Answers, and Q&A)
	pollPublicGroup := r.Group("/api/polls")
	{
		pollPublicGroup.GET("/:id", pollHandler.GetPollByID)
		pollPublicGroup.GET("/:id/results", pollHandler.GetPollResults)
		pollPublicGroup.POST("/:id/vote", pollHandler.Vote)
		pollPublicGroup.POST("/:id/response", pollHandler.SubmitOpenResponse)
		pollPublicGroup.POST("/:id/qa", pollHandler.SubmitQAQuestion)
		pollPublicGroup.POST("/:id/qa/:qaId/upvote", pollHandler.UpvoteQAQuestion)
	}

	// 5. Protected Poll Routes (Creating, Closing, Active Slide Control)
	pollProtectedGroup := r.Group("/api/polls")
	pollProtectedGroup.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		pollProtectedGroup.POST("", pollHandler.CreatePoll)
		pollProtectedGroup.POST("/:id/close", pollHandler.ClosePoll)
		pollProtectedGroup.POST("/:id/slide", pollHandler.SetActiveSlide)
	}

	r.GET("/api/my-polls", middleware.AuthMiddleware(cfg.JWTSecret), pollHandler.GetMyPolls)


	// 6. WebSocket Endpoint
	r.GET("/ws/polls/:id", wsHandler.ServeWS)

	return r
}
