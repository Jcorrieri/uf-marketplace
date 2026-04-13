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
	cursor string,
) ([]models.Listing, error) {

	queryObj := gorm.G[models.Listing](s.db).
		Preload("Seller", nil).
		Preload("Images", ImageIDsOnly).
		Where(key+" LIKE ?", "%"+query+"%").
		Order("id DESC").
		Limit(limit)

	if cursor != "" && cursor != "0" {
		queryObj.Where("id < ?", cursor)
	}

	return queryObj.Find(ctx)
}

// User CURSOR to track last returned listing by ID
func (s *ListingService) GetAll(
	ctx context.Context,
	limit int,
	cursor string,
) ([]models.Listing, error) {

	queryObj := gorm.G[models.Listing](s.db).
		Preload("Seller", nil).
		Preload("Images", ImageIDsOnly).
		Order("id DESC").
		Limit(limit)

	if cursor != "" && cursor != "0" {
		queryObj.Where("id < ?", cursor)
	}

	return queryObj.Find(ctx)
}

func (s *ListingService) Create(ctx context.Context, listing *models.Listing) error {
	return gorm.G[models.Listing](s.db).Create(ctx, listing)
}

func (s *ListingService) GetImageByID(ctx context.Context, imageID uint) (models.ListingImage, error) {
	return gorm.G[models.ListingImage](s.db).Where("id = ?", imageID).First(ctx)
}

// MarkAsSold soft-deletes a listing (marks it as sold)
func (s *ListingService) MarkAsSold(ctx context.Context, listingID uint) error {
	_, err := gorm.G[models.Listing](s.db).
		Where("id = ?", listingID).
		Delete(ctx)
	return err
}

// RestoreListing restores a soft-deleted listing (un-sells it)
func (s *ListingService) RestoreListing(ctx context.Context, listingID uint) error {
	return s.db.Unscoped().
		Model(&models.Listing{}).
		Where("id = ?", listingID).
		Update("deleted_at", nil).
		Error
}
