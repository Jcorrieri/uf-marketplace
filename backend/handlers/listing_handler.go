package handlers

import (
	"net/http"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ListingHandler struct {
	DB *gorm.DB
}

func NewListingHandler(db *gorm.DB) *ListingHandler {
	return &ListingHandler{DB: db}
}

// GET /api/listings
func (h *ListingHandler) GetListings(c *gin.Context) {
	var listings []models.Listing
	result := h.DB.Find(&listings)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch listings"})
		return
	}
	c.JSON(http.StatusOK, listings)
}

// POST /api/listings
func (h *ListingHandler) CreateListing(c *gin.Context) {
	var listing models.Listing
	if err := c.ShouldBindJSON(&listing); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	h.DB.Create(&listing)
	c.JSON(http.StatusCreated, listing)
}
