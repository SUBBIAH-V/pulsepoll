package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                string
	Env                 string
	FrontendURL         string
	MongoURI            string
	MongoDBName         string
	RedisURL            string
	JWTSecret           string
	JWTExpirationHours  int
}

func LoadConfig() *Config {
	// Try loading .env file, ignore error if missing (will use environment variables)
	if err := godotenv.Load(); err != nil {
		log.Println("Note: .env file not found, reading settings from environment")
	}

	port := getEnv("PORT", "8080")
	env := getEnv("ENV", "development")
	frontendURL := getEnv("FRONTEND_URL", "http://localhost:5173")
	mongoURI := getEnv("MONGO_URI", "mongodb://localhost:27017/pulsepoll")
	mongoDBName := getEnv("MONGO_DB_NAME", "pulsepoll")
	redisURL := getEnv("REDIS_URL", "redis://localhost:6379")
	jwtSecret := getEnv("JWT_SECRET", "pulsepoll_super_secret_jwt_key_2026_hcl_guvi")
	
	expHoursStr := getEnv("JWT_EXPIRATION_HOURS", "24")
	expHours, err := strconv.Atoi(expHoursStr)
	if err != nil {
		expHours = 24
	}

	return &Config{
		Port:               port,
		Env:                env,
		FrontendURL:        frontendURL,
		MongoURI:           mongoURI,
		MongoDBName:        mongoDBName,
		RedisURL:           redisURL,
		JWTSecret:          jwtSecret,
		JWTExpirationHours: expHours,
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}
