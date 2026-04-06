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

// User CURSOR to track last returned listing by ID
func (s *ListingService) Search(
	ctx context.Context,
	key string,
	query string,
	limit int,
	cursor uint,
) ([]models.Listing, error) {

	queryObj := gorm.G[models.Listing](s.db).
		Preload("Seller", nil).
		Where(key+" LIKE ?", "%"+query+"%").
		Order("id DESC").
		Limit(limit)
	
	if cursor > 0 {
		queryObj.Where("id < ?", cursor)
	}

	return queryObj.Find(ctx)
}

// User CURSOR to track last returned listing by ID
func (s *ListingService) GetAll(
	ctx context.Context,
	limit int,
	cursor uint,
) ([]models.Listing, error) {

	queryObj := gorm.G[models.Listing](s.db).
		Preload("Seller", nil).
		Order("id DESC").
		Limit(limit)
	
	if cursor > 0 {
		queryObj.Where("id < ?", cursor)
	}

	return queryObj.Find(ctx)
}

func (s *ListingService) Create(ctx context.Context, listing *models.Listing) error {
	return gorm.G[models.Listing](s.db).Create(ctx, listing)
}
