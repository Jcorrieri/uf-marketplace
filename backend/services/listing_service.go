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

func (s *ListingService) Search(ctx context.Context, key string, title string) ([]models.Listing, error) {
	return gorm.G[models.Listing](s.db).Preload("Seller", nil).Where(key+" LIKE ?", "%"+title+"%").Find(ctx)
}

func (s *ListingService) GetAll(ctx context.Context) ([]models.Listing, error) {
	return gorm.G[models.Listing](s.db).Preload("Seller", nil).Find(ctx)
}

func (s *ListingService) Create(ctx context.Context, listing *models.Listing) error {
	return gorm.G[models.Listing](s.db).Create(ctx, listing)
}
