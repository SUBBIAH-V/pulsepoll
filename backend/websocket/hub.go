package websocket

import (
	"encoding/json"
	"log"
	"sync"
)

type WSMessage struct {
	Type       string      `json:"type"`       // "poll_update", "ping", etc.
	PollID     string      `json:"pollId"`
	Results    interface{} `json:"results"`
	TotalVotes int64       `json:"totalVotes"`
}

type Hub struct {
	// Map of poll ID to set of clients
	pollRooms map[string]map[*Client]bool
	
	// Register requests from clients
	Register chan *Client

	// Unregister requests from clients
	Unregister chan *Client

	// Mutex to protect map operations
	mu sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		pollRooms:  make(map[string]map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			if _, exists := h.pollRooms[client.PollID]; !exists {
				h.pollRooms[client.PollID] = make(map[*Client]bool)
			}
			h.pollRooms[client.PollID][client] = true
			h.mu.Unlock()
			log.Printf("WebSocket Client connected to Poll [%s]. Total subscribers: %d", client.PollID, len(h.pollRooms[client.PollID]))

		case client := <-h.Unregister:
			h.mu.Lock()
			if clients, exists := h.pollRooms[client.PollID]; exists {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.Send)
					if len(clients) == 0 {
						delete(h.pollRooms, client.PollID)
					}
				}
			}
			h.mu.Unlock()
			log.Printf("WebSocket Client disconnected from Poll [%s]", client.PollID)
		}
	}
}

// BroadcastToPoll sends a JSON message to all subscribers watching a specific pollID
func (h *Hub) BroadcastToPoll(pollID string, message WSMessage) {
	h.mu.RLock()
	clients, exists := h.pollRooms[pollID]
	if !exists || len(clients) == 0 {
		h.mu.RUnlock()
		return
	}

	data, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling WS message: %v", err)
		h.mu.RUnlock()
		return
	}

	for client := range clients {
		select {
		case client.Send <- data:
		default:
			close(client.Send)
			delete(clients, client)
		}
	}
	h.mu.RUnlock()
	log.Printf("Broadcasted live poll update for [%s] to %d clients", pollID, len(clients))
}
