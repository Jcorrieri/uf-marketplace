package services

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// ---- WebSocket tuning constants ----
const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 4096
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow all origins for now — tighten in production
	CheckOrigin: func(r *http.Request) bool { return true },
}

// ---- Message shape over the wire ----
type WSMessage struct {
	ConversationID uuid.UUID `json:"conversation_id"`
	SenderID       uuid.UUID `json:"sender_id"`
	SenderName     string    `json:"sender_name"`
	Content        string    `json:"content"`
	CreatedAt      time.Time `json:"created_at"`
}

// ---- Client ----
type Client struct {
	hub            *Hub
	conn           *websocket.Conn
	send           chan []byte
	conversationID uuid.UUID
	userID         uuid.UUID
}

// readPump reads messages from the browser and broadcasts them.
func (cl *Client) readPump(chatService *ChatService) {
	defer func() {
		cl.hub.unregister <- cl
		cl.conn.Close()
	}()

	cl.conn.SetReadLimit(maxMessageSize)
	cl.conn.SetReadDeadline(time.Now().Add(pongWait))
	cl.conn.SetPongHandler(func(string) error {
		cl.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, rawMsg, err := cl.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("ws error: %v", err)
			}
			break
		}

		// Expect plain text content from the browser
		content := string(rawMsg)
		if content == "" {
			continue
		}

		// Persist the message to the DB
		msg := &models.Message{
			ConversationID: cl.conversationID,
			SenderID:       cl.userID,
			Content:        content,
		}

		if err := chatService.SaveMessage(context.Background(), msg); err != nil {
			log.Printf("failed to save message: %v", err)
			continue
		}

		// Re-fetch with sender preloaded so we have the sender's name
		messages, err := chatService.GetMessages(context.Background(), cl.conversationID)
		if err != nil || len(messages) == 0 {
			continue
		}
		saved := messages[len(messages)-1]

		// Build the outbound payload
		outbound := WSMessage{
			ConversationID: cl.conversationID,
			SenderID:       cl.userID,
			SenderName:     saved.Sender.FirstName + " " + saved.Sender.LastName,
			Content:        content,
			CreatedAt:      saved.CreatedAt,
		}

		data, err := json.Marshal(outbound)
		if err != nil {
			continue
		}

		cl.hub.broadcast <- broadcastMsg{
			conversationID: cl.conversationID,
			data:           data,
		}
	}
}

// writePump drains the send channel and writes to the browser.
func (cl *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		cl.conn.Close()
	}()

	for {
		select {
		case message, ok := <-cl.send:
			cl.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				cl.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := cl.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			cl.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := cl.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ---- Hub ----
type broadcastMsg struct {
	conversationID uuid.UUID
	data           []byte
}

type Hub struct {
	// rooms maps conversationID → set of connected clients
	rooms      map[uuid.UUID]map[*Client]bool
	broadcast  chan broadcastMsg
	register   chan *Client
	unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[uuid.UUID]map[*Client]bool),
		broadcast:  make(chan broadcastMsg),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run is the Hub's main goroutine — call this once at startup.
func (h *Hub) Run() {
	for {
		select {

		case client := <-h.register:
			room := client.conversationID
			if h.rooms[room] == nil {
				h.rooms[room] = make(map[*Client]bool)
			}
			h.rooms[room][client] = true

		case client := <-h.unregister:
			room := client.conversationID
			if _, ok := h.rooms[room][client]; ok {
				delete(h.rooms[room], client)
				close(client.send)
				// Clean up empty rooms
				if len(h.rooms[room]) == 0 {
					delete(h.rooms, room)
				}
			}

		case msg := <-h.broadcast:
			// Send to every client in the conversation's room
			for client := range h.rooms[msg.conversationID] {
				select {
				case client.send <- msg.data:
				default:
					// Client is too slow / disconnected — drop and remove
					close(client.send)
					delete(h.rooms[msg.conversationID], client)
				}
			}
		}
	}
}

// ServeWs upgrades the HTTP connection and registers the new client.
func ServeWs(hub *Hub, chatService *ChatService, w http.ResponseWriter, r *http.Request, conversationID uuid.UUID, userID uuid.UUID) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws upgrade error: %v", err)
		return
	}

	client := &Client{
		hub:            hub,
		conn:           conn,
		send:           make(chan []byte, 256),
		conversationID: conversationID,
		userID:         userID,
	}

	hub.register <- client

	// Each client gets two goroutines — one to read, one to write
	go client.writePump()
	go client.readPump(chatService)
}
