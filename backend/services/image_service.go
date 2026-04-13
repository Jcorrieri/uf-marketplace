package services

import (
	"context"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ImageService struct {
	db *gorm.DB
}

func NewImageService(db *gorm.DB) *ImageService {
	return &ImageService{db: db}
}

// Global function to preload only image IDs for listings (users, listings)
// See https://gorm.io/docs/preload.html
func ImageIDsOnly(db gorm.PreloadBuilder) error {
	db.Select("id", "owner_id", "owner_type").Order("position asc")
	return nil
}

func (s *ImageService) GetImageByID(ctx context.Context, imageID uuid.UUID) (models.Image, error) {
	return gorm.G[models.Image](s.db).Where("id = ?", imageID).First(ctx)
}
