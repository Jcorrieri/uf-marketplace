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
	title string,
	limit int,
	cursor uint,
) ([]models.Listing, error) {

	query := gorm.G[models.Listing](s.db).
		Preload("Seller", nil).
		Where(key+" LIKE ?", "%"+title+"%").
		Order("id DESC").
		Limit(limit)
	
	if cursor > 0 {
		query.Where("id < ?", cursor)
	}

	return query.Find(ctx)
}

// User CURSOR to track last returned listing by ID
func (s *ListingService) GetAll(
	ctx context.Context,
	limit int,
	cursor uint,
) ([]models.Listing, error) {

	query := gorm.G[models.Listing](s.db).
		Preload("Seller", nil).
		Order("id DESC").
		Limit(limit)
	
	if cursor > 0 {
		query.Where("id < ?", cursor)
	}

	return query.Find(ctx)
}

func (s *ListingService) Create(ctx context.Context, listing *models.Listing) error {
	return gorm.G[models.Listing](s.db).Create(ctx, listing)
}
