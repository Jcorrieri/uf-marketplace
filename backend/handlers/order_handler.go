package handlers

import (
	"net/http"
	"strconv"

	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type OrderHandler struct {
	orderService *services.OrderService
}

func NewOrderHandler(s *services.OrderService) *OrderHandler {
	return &OrderHandler{orderService: s}
}

// POST /api/orders - Create a new order (purchase a listing)
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	// Get buyer ID from context (set by auth middleware)
	buyerID, err := uuid.Parse(c.MustGet("userID").(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	// Parse request body
	type CreateOrderRequest struct {
		ListingID uint `json:"listing_id" binding:"required"`
	}

	var req CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	order, err := h.orderService.Create(c.Request.Context(), buyerID, req.ListingID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	// Fetch the created order with relations for response
	orderWithRelations, err := h.orderService.GetByID(c.Request.Context(), order.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch order"})
		return
	}

	c.JSON(http.StatusCreated, orderWithRelations.GetResponse())
}

// GET /api/orders/buyer/me - Get current user's order history
func (h *OrderHandler) GetMyOrders(c *gin.Context) {
	buyerID, err := uuid.Parse(c.MustGet("userID").(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	limit, err := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if err != nil || limit > 100 {
		limit = 20
	}

	offset, err := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if err != nil || offset < 0 {
		offset = 0
	}

	orders, err := h.orderService.GetBuyerOrderHistory(c.Request.Context(), buyerID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}

	// Convert to response format
	responses := make([]interface{}, len(orders))
	for i, order := range orders {
		responses[i] = order.GetResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": responses,
		"count":  len(orders),
	})
}

// GET /api/orders/seller/me - Get current user's sales (orders where they are seller)
func (h *OrderHandler) GetMySales(c *gin.Context) {
	sellerID, err := uuid.Parse(c.MustGet("userID").(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	limit, err := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if err != nil || limit > 100 {
		limit = 20
	}

	offset, err := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if err != nil || offset < 0 {
		offset = 0
	}

	orders, err := h.orderService.GetSellerOrderHistory(c.Request.Context(), sellerID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sales"})
		return
	}

	// Convert to response format
	responses := make([]interface{}, len(orders))
	for i, order := range orders {
		responses[i] = order.GetResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"orders": responses,
		"count":  len(orders),
	})
}

// GET /api/orders/:id - Get single order details
func (h *OrderHandler) GetOrder(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	order, err := h.orderService.GetByID(c.Request.Context(), uint(orderID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, order.GetResponse())
}

// PUT /api/orders/:id/cancel - Cancel an order
func (h *OrderHandler) CancelOrder(c *gin.Context) {
	userID, err := uuid.Parse(c.MustGet("userID").(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	// Verify user owns this order (is the buyer)
	order, err := h.orderService.GetByID(c.Request.Context(), uint(orderID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	if order.BuyerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only cancel your own orders"})
		return
	}

	if err := h.orderService.Cancel(c.Request.Context(), uint(orderID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel order"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order cancelled successfully"})
}

// DELETE /api/orders/:id - Delete an order from history and restore the listing
func (h *OrderHandler) DeleteOrder(c *gin.Context) {
	userID, err := uuid.Parse(c.MustGet("userID").(string))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
		return
	}

	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	// Verify user owns this order (is the buyer)
	order, err := h.orderService.GetByID(c.Request.Context(), uint(orderID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	if order.BuyerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own orders"})
		return
	}

	if err := h.orderService.DeleteOrder(c.Request.Context(), uint(orderID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete order"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order deleted successfully and listing restored to marketplace"})
}
