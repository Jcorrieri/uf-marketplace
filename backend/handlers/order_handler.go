package handlers

import (
	"net/http"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type OrderHandler struct {
	orderService *services.OrderService
}

func NewOrderHandler(orderService *services.OrderService) *OrderHandler {
	return &OrderHandler{
		orderService: orderService,
	}
}

type CreateOrderRequest struct {
	ListingID    string  `json:"listing_id" binding:"required"`
	Title        string  `json:"title" binding:"required"`
	Description  string  `json:"description" binding:"required"`
	Price        float64 `json:"price" binding:"required"`
	FirstImageID *string `json:"first_image_id"`
	SellerName   string  `json:"seller_name" binding:"required"`
}

// POST /api/orders
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	userID, err := uuid.Parse(c.MustGet("userID").(string))
	if err != nil {
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
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid listing ID"})
		return
	}

	if input.Price < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid price"})
		return
	}

	var firstImageID *uuid.UUID
	if input.FirstImageID != nil && *input.FirstImageID != "" {
		parsed, err := uuid.Parse(*input.FirstImageID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid first_image_id"})
			return
		}
		firstImageID = &parsed
	}

	order, err := h.orderService.CreateFromInput(
		c.Request.Context(),
		userID,
		services.CreateOrderInput{
			ListingID:    listingID,
			Title:        input.Title,
			Description:  input.Description,
			Price:        input.Price,
			FirstImageID: firstImageID,
			SellerName:   input.SellerName,
		},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	c.JSON(http.StatusCreated, order.GetResponse())
}

// GET /api/orders/me
func (h *OrderHandler) GetMyOrders(c *gin.Context) {
	userID, err := uuid.Parse(c.MustGet("userID").(string))
	if err != nil {
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
