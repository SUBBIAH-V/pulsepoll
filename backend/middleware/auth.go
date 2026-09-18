package middleware

import (
	"net/http"
	"strings"

	"live-polling-app/backend/models"
	"live-polling-app/backend/utils"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, models.ErrorResponse("Authorization header missing"))
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, models.ErrorResponse("Invalid authorization header format. Expected 'Bearer <token>'"))
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := utils.ValidateJWT(tokenString, secret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, models.ErrorResponse("Invalid or expired authentication token"))
			c.Abort()
			return
		}

		// Inject UserID and Email into Gin Request Context
		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)

		c.Next()
	}
}
