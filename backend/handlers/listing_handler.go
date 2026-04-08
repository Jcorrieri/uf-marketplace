package handlers

import (
	"net/http"
	"strconv"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"
)

type ListingHandler struct {
	listingService *services.ListingService
}

func NewListingHandler(s *services.ListingService) *ListingHandler {
	return &ListingHandler{listingService: s}
}

// GET /api/listings
func (h *ListingHandler) GetListings(c *gin.Context) {
	limit, err := strconv.Atoi(c.Query("limit"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter."})
		return
	}

	cursor64, err := strconv.ParseUint(c.Query("cursor"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cursor parameter."})
		return
	}

	cursor := uint(cursor64) // ParseUint returns uint64, but listings ID is of type uint

	var listings []models.Listing

	key, exists := c.GetQuery("key")
	if exists && key != "" {
		query := c.Query("query")
		listings, err = h.listingService.Search(c.Request.Context(), key, query, limit, cursor)
	} else {
		listings, err = h.listingService.GetAll(c.Request.Context(), limit, cursor)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch listings."})
		return
	}

	var response []models.ListingResponse
	for _, l := range listings { response = append(response, l.GetResponse()) }

	c.JSON(http.StatusOK, response)
}

// POST /api/listings
func (h *ListingHandler) CreateListing(c *gin.Context) {
	var listing models.Listing
	if err := c.ShouldBindJSON(&listing); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.listingService.Create(c.Request.Context(), &listing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create listing"})
		return
	}

	c.JSON(http.StatusCreated, listing.GetResponse())
}
