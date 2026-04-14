package handlers

import (
	"errors"
	"net/http"

	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// OrderHandler exposes REST endpoints for the order/purchase feature.
type OrderHandler struct {
	orderService *services.OrderService
}

func NewOrderHandler(s *services.OrderService) *OrderHandler {
	return &OrderHandler{orderService: s}
}

// buyListingInput is the expected JSON body for POST /api/orders.
type buyListingInput struct {
	ListingID string `json:"listing_id" binding:"required"`
}

// POST /api/orders
// Creates a purchase order for the authenticated user.
func (h *OrderHandler) BuyListing(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	buyerID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var input buyListingInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "listing_id is required"})
		return
	}

	listingID, err := uuid.Parse(input.ListingID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid listing ID"})
		return
	}

	order, err := h.orderService.CreateOrder(c.Request.Context(), buyerID, listingID)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrSelfPurchase):
			c.JSON(http.StatusForbidden, gin.H{"error": "You cannot purchase your own listing"})
		case errors.Is(err, services.ErrListingNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "Listing not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		}
		return
	}

	c.JSON(http.StatusCreated, order.GetResponse())
}

// GET /api/orders/purchases
// Returns all orders where the authenticated user is the buyer.
func (h *OrderHandler) GetMyPurchases(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	buyerID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	orders, err := h.orderService.GetOrdersByBuyerID(c.Request.Context(), buyerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch purchase history"})
		return
	}

	response := make([]interface{}, 0, len(orders))
	for i := range orders {
		response = append(response, orders[i].GetResponse())
	}

	c.JSON(http.StatusOK, response)
}

// GET /api/orders/sales
// Returns all orders where the authenticated user is the seller.
func (h *OrderHandler) GetMySales(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	sellerID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	orders, err := h.orderService.GetOrdersBySellerID(c.Request.Context(), sellerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sales history"})
		return
	}

	response := make([]interface{}, 0, len(orders))
	for i := range orders {
		response = append(response, orders[i].GetResponse())
	}

	c.JSON(http.StatusOK, response)
}
