package services

import (
	"context"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"gorm.io/gorm"
)

type ListingService struct {
	db *gorm.DB
}

func NewListingService(db *gorm.DB) *ListingService {
	return &ListingService{db: db}
}

func (s *ListingService) GetAll(ctx context.Context) ([]models.Listing, error) {
	return gorm.G[models.Listing](s.db).Preload("Seller", nil).Preload("Images", nil).Find(ctx)
}

func (s *ListingService) Create(ctx context.Context, listing *models.Listing) error {
	return gorm.G[models.Listing](s.db).Create(ctx, listing)
}

func (s *ListingService) GetImageByID(ctx context.Context, imageID uint) (models.ListingImage, error) {
	return gorm.G[models.ListingImage](s.db).Where("id = ?", imageID).First(ctx)
}
