package handlers

import (
	"errors"
	"net/http"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderHandler struct {
	orderService   *services.OrderService
	listingService *services.ListingService
}

func NewOrderHandler(
	orderService *services.OrderService,
	listingService *services.ListingService,
) *OrderHandler {
	return &OrderHandler{
		orderService:   orderService,
		listingService: listingService,
	}
}

type CreateOrderRequest struct {
	ListingID string `json:"listing_id" binding:"required"`
}

// POST /api/orders
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userIDStr, ok := userIDVal.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input CreateOrderRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	listingID, err := uuid.Parse(input.ListingID)
	if err != nil || listingID == uuid.Nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid listing ID"})
		return
	}

	// Load listing from DB to ensure data integrity
	listing, err := h.listingService.GetByID(c.Request.Context(), listingID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Listing not found"})
		return
	}

	// Prevent buyer from purchasing their own listing
	if listing.SellerID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot purchase your own listing"})
		return
	}

	// Check if listing is still available
	if listing.Status != "available" {
		c.JSON(http.StatusConflict, gin.H{"error": "Listing is no longer available"})
		return
	}

	order, err := h.orderService.CreateFromListing(
		c.Request.Context(),
		userID,
		&listing,
	)
	if err != nil {
		// If error is record not found (from status check in transaction), listing is no longer available
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusConflict, gin.H{"error": "Listing is no longer available"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	c.JSON(http.StatusCreated, order.GetResponse())
}

// GET /api/orders/me
func (h *OrderHandler) GetMyOrders(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userIDStr, ok := userIDVal.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil || userID == uuid.Nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	orders, err := h.orderService.GetByBuyerID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}

	response := make([]models.OrderResponse, 0, len(orders))
	for i := range orders {
		response = append(response, orders[i].GetResponse())
	}

	c.JSON(http.StatusOK, response)
}
