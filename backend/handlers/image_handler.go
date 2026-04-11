package handlers

import (
	"net/http"

	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ImageHandler struct {
	imageService *services.ImageService
}

func NewImageHandler(s *services.ImageService) *ImageHandler {
	return &ImageHandler{imageService: s}
}

// GET /api/images/:imageId
func (h *ImageHandler) GetImage(c *gin.Context) {
	imageID, err := uuid.Parse(c.Param("imageId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	img, err := h.imageService.GetImageByID(c.Request.Context(), imageID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	contentType := http.DetectContentType(img.Data)
	c.Data(http.StatusOK, contentType, img.Data)
}
