package database

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	Client      *redis.Client
	IsConnected bool
	mu          sync.RWMutex
	memoryHashes map[string]map[string]int64
	memoryKeys   map[string]string
}

func ConnectRedis(redisURL string) (*RedisClient, error) {
	log.Printf("Connecting to Redis...")
	var opt *redis.Options

	if parsed, err := redis.ParseURL(redisURL); err == nil {
		opt = parsed
	} else {
		// If redisURL is a raw password/token or hostname
		opt = &redis.Options{
			Addr:     "localhost:6379",
			Password: redisURL,
		}
	}

	client := redis.NewClient(opt)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	rc := &RedisClient{
		Client:       client,
		IsConnected:  false,
		memoryHashes: make(map[string]map[string]int64),
		memoryKeys:   make(map[string]string),
	}

	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("Notice: Could not ping Redis server (%v). Fallback in-memory Redis client activated.", err)
		return rc, nil
	}

	log.Println("Successfully connected to Redis server!")
	rc.IsConnected = true
	return rc, nil
}

// HIncrBy atomically increments the vote count of an option in a poll hash
func (r *RedisClient) HIncrBy(ctx context.Context, key, field string, incr int64) (int64, error) {
	if r.IsConnected && r.Client != nil {
		val, err := r.Client.HIncrBy(ctx, key, field, incr).Result()
		if err == nil {
			return val, nil
		}
		log.Printf("Redis HIncrBy error: %v, using memory fallback", err)
	}

	// Memory fallback
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.memoryHashes[key]; !exists {
		r.memoryHashes[key] = make(map[string]int64)
	}
	r.memoryHashes[key][field] += incr
	return r.memoryHashes[key][field], nil
}

// HGetAll retrieves all field-value pairs from a poll hash
func (r *RedisClient) HGetAll(ctx context.Context, key string) (map[string]string, error) {
	if r.IsConnected && r.Client != nil {
		res, err := r.Client.HGetAll(ctx, key).Result()
		if err == nil && len(res) > 0 {
			return res, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	result := make(map[string]string)
	if fields, exists := r.memoryHashes[key]; exists {
		for f, v := range fields {
			result[f] = fmt.Sprintf("%d", v)
		}
	}
	return result, nil
}

// HSet sets field values in a hash (used during poll initialization)
func (r *RedisClient) HSet(ctx context.Context, key string, values ...interface{}) error {
	if r.IsConnected && r.Client != nil {
		if err := r.Client.HSet(ctx, key, values...).Err(); err == nil {
			return nil
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.memoryHashes[key]; !exists {
		r.memoryHashes[key] = make(map[string]int64)
	}
	for i := 0; i < len(values)-1; i += 2 {
		field := fmt.Sprintf("%v", values[i])
		val := int64(0)
		switch v := values[i+1].(type) {
		case int:
			val = int64(v)
		case int64:
			val = v
		}
		r.memoryHashes[key][field] = val
	}
	return nil
}

// Set stores a key-value pair (e.g. for anti-duplicate voting checks)
func (r *RedisClient) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	if r.IsConnected && r.Client != nil {
		if err := r.Client.Set(ctx, key, value, expiration).Err(); err == nil {
			return nil
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.memoryKeys[key] = fmt.Sprintf("%v", value)
	return nil
}

// Exists checks if a key exists
func (r *RedisClient) Exists(ctx context.Context, key string) (bool, error) {
	if r.IsConnected && r.Client != nil {
		count, err := r.Client.Exists(ctx, key).Result()
		if err == nil {
			return count > 0, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	_, exists := r.memoryKeys[key]
	return exists, nil
}

// Publish broadcasts a message to a Redis Pub/Sub channel for automated multi-server event distribution
func (r *RedisClient) Publish(ctx context.Context, channel string, message interface{}) error {
	if r.IsConnected && r.Client != nil {
		return r.Client.Publish(ctx, channel, message).Err()
	}
	return nil
}

// Subscribe subscribes to a Redis Pub/Sub channel
func (r *RedisClient) Subscribe(ctx context.Context, channels ...string) *redis.PubSub {
	if r.IsConnected && r.Client != nil {
		return r.Client.Subscribe(ctx, channels...)
	}
	return nil
}

