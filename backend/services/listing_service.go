package services

import (
	"context"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/google/uuid"
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
	cursor uuid.UUID,
) ([]models.Listing, error) {

	queryObj := gorm.G[models.Listing](s.db).
		Preload("Seller", nil).
		Preload("Images", ImageIDsOnly).
		Where(key+" LIKE ?", "%"+query+"%").
		Where("status = ?", "available").
		Order("id DESC").
		Limit(limit)

	if cursor != uuid.Nil {
		queryObj = queryObj.Where("id < ?", cursor)
	}

	return queryObj.Find(ctx)
}

// User CURSOR to track last returned listing by ID
func (s *ListingService) GetAll(
	ctx context.Context,
	limit int,
	cursor uuid.UUID,
) ([]models.Listing, error) {

	queryObj := gorm.G[models.Listing](s.db).
		Preload("Seller", nil).
		Preload("Images", ImageIDsOnly).
		Where("status = ?", "available").
		Order("id DESC").
		Limit(limit)

	if cursor != uuid.Nil {
		queryObj = queryObj.Where("id < ?", cursor)
	}

	return queryObj.Find(ctx)
}

func (s *ListingService) GetBySellerID(ctx context.Context, sellerID uuid.UUID) ([]models.Listing, error) {
	return gorm.G[models.Listing](s.db).
		Preload("Seller", nil).
		Preload("Images", ImageIDsOnly).
		Where("seller_id = ?", sellerID).
		Order("id DESC").
		Find(ctx)
}

func (s *ListingService) GetByID(ctx context.Context, id uuid.UUID) (models.Listing, error) {
	return gorm.G[models.Listing](s.db).
		Preload("Seller", nil).
		Preload("Images", ImageIDsOnly).
		Where("id = ?", id).
		First(ctx)
}

func (s *ListingService) Create(ctx context.Context, listing *models.Listing) error {
	return gorm.G[models.Listing](s.db).Create(ctx, listing)
}

type UpdateListingRequest struct {
	Title       string
	Description string
	Price       float64
}

func (s *ListingService) Update(
	ctx context.Context,
	id uuid.UUID,
	req UpdateListingRequest,
) (*models.Listing, error) {

	rows, err := gorm.G[models.Listing](s.db).
		Where("id = ?", id).
		Omit("Images").
		Updates(ctx, models.Listing{
			Title:       req.Title,
			Description: req.Description,
			Price:       req.Price,
		})

	if err != nil {
		return nil, err
	}

	if rows == 0 {
		return nil, gorm.ErrRecordNotFound
	}

	// Get updated listing
	listing, err := gorm.G[models.Listing](s.db).Where("id = ?", id).First(ctx)
	if err != nil {
		return nil, err
	}

	return &listing, nil
}

func (s *ListingService) ReplaceImages(ctx context.Context, listingID uuid.UUID, newImages []models.Image) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Delete old images for this listing
		if err := tx.Unscoped().Where("owner_id = ? AND owner_type = ?", listingID, "listings").Delete(&models.Image{}).Error; err != nil {
			return err
		}
		// Insert new images
		if len(newImages) > 0 {
			for i := range newImages {
				newImages[i].OwnerID = listingID
				newImages[i].OwnerType = "listings"
			}
			if err := tx.Create(&newImages).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *ListingService) Delete(ctx context.Context, id uuid.UUID) error {
	// Deleting a record requires some additional processing. Gorm
	// uses soft deletion by default (see https://gorm.io/docs/delete.html#Soft-Delete).
	rowsAffected, err := gorm.G[models.Listing](s.db).Where("id = ?", id).Delete(ctx)

	if err != nil {
		return err
	}

	// No affected rows ⇒ no record existed; should return an error
	if rowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}
