package handlers

import (
	"net/http"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ChatHandler struct {
	chatService *services.ChatService
	hub         *services.Hub
}

func NewChatHandler(s *services.ChatService, hub *services.Hub) *ChatHandler {
	return &ChatHandler{chatService: s, hub: hub}
}

// POST /api/conversations
// Body: { "listing_id": "...", "seller_id": "..." }
func (h *ChatHandler) StartConversation(c *gin.Context) {
	buyerID, err := uuid.Parse(c.MustGet("userID").(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var body struct {
		ListingID string `json:"listing_id"`
		SellerID  string `json:"seller_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	listingID, err := uuid.Parse(body.ListingID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid listing_id"})
		return
	}

	sellerID, err := uuid.Parse(body.SellerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid seller_id"})
		return
	}

	// Prevent sellers from messaging themselves
	if buyerID == sellerID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot message yourself"})
		return
	}

	convo, err := h.chatService.GetOrCreateConversation(c.Request.Context(), buyerID, sellerID, listingID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start conversation"})
		return
	}

	c.JSON(http.StatusOK, convo.GetResponse())
}

// GET /api/conversations
func (h *ChatHandler) GetConversations(c *gin.Context) {
	userID, err := uuid.Parse(c.MustGet("userID").(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	convos, err := h.chatService.GetUserConversations(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch conversations"})
		return
	}

	var response []models.ConversationResponse
	for _, c := range convos {
		response = append(response, c.GetResponse())
	}

	if response == nil {
		response = []models.ConversationResponse{}
	}
	c.JSON(http.StatusOK, response)
}

// GET /api/conversations/:id/messages
func (h *ChatHandler) GetMessages(c *gin.Context) {
	userID, err := uuid.Parse(c.MustGet("userID").(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	conversationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid conversation ID"})
		return
	}

	// Verify user is a participant before returning messages
	convo, err := h.chatService.GetByID(c.Request.Context(), conversationID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conversation not found"})
		return
	}

	if userID != convo.BuyerID && userID != convo.SellerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	messages, err := h.chatService.GetMessages(c.Request.Context(), conversationID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	var response []models.MessageResponse
	for _, m := range messages {
		response = append(response, m.GetResponse())
	}

	c.JSON(http.StatusOK, response)
}

// GET /ws/chat/:id  — WebSocket upgrade
func (h *ChatHandler) ServeWs(c *gin.Context) {
	userID, err := uuid.Parse(c.MustGet("userID").(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	conversationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid conversation ID"})
		return
	}

	// Verify user is a participant before allowing WebSocket connection
	convo, err := h.chatService.GetByID(c.Request.Context(), conversationID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conversation not found"})
		return
	}

	if userID != convo.BuyerID && userID != convo.SellerID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	services.ServeWs(h.hub, h.chatService, c.Writer, c.Request, conversationID, userID)
}
