package handlers

import (
	"net/http"
	"strconv"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/Jcorrieri/uf-marketplace/backend/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

	cursor := c.Query("cursor") // UUID string, empty or "0" means no cursor

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
	for _, l := range listings {
		response = append(response, l.GetResponse())
	}

	c.JSON(http.StatusOK, response)
}

// POST /api/listings (multipart form)
func (h *ListingHandler) CreateListing(c *gin.Context) {
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

	title := c.PostForm("title")
	description := c.PostForm("description")
	priceStr := c.PostForm("price")

	if title == "" || description == "" || priceStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title, description, and price are required"})
		return
	}

	price, err := strconv.ParseFloat(priceStr, 64)
	if err != nil || price < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid price"})
		return
	}

	listing := models.Listing{
		Title:       title,
		Description: description,
		Price:       price,
		SellerID:    sellerID,
	}

	// Parse multiple image files
	form, err := c.MultipartForm()
	if err == nil && form.File["images"] != nil {
		for i, fileHeader := range form.File["images"] {
			data, mimeType, err := utils.ProcessImageFile(fileHeader)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			listing.Images = append(listing.Images, models.Image{
				Data:     data,
				MimeType: mimeType,
				Position: i,
			})
		}
	}

	if err := h.listingService.Create(c.Request.Context(), &listing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create listing"})
		return
	}

	c.JSON(http.StatusCreated, listing.GetResponse())
}
