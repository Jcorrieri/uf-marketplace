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

func (s *ListingService) GetBySellerID(ctx context.Context, sellerID string) ([]models.Listing, error) {
	return gorm.G[models.Listing](s.db).
		Preload("Seller", nil).
		Preload("Images", ImageIDsOnly).
		Where("seller_id = ?", sellerID).
		Order("id DESC").
		Find(ctx)
}

func (s *ListingService) GetByID(ctx context.Context, id string) (models.Listing, error) {
	return gorm.G[models.Listing](s.db).
		Preload("Seller", nil).
		Preload("Images", ImageIDsOnly).
		Where("id = ?", id).
		First(ctx)
}

func (s *ListingService) Create(ctx context.Context, listing *models.Listing) error {
	return gorm.G[models.Listing](s.db).Create(ctx, listing)
}

func (s *ListingService) GetImageByID(ctx context.Context, imageID string) (models.Image, error) {
	parsedID, err := uuid.Parse(imageID)
	if err != nil {
		return models.Image{}, err
	}
	return gorm.G[models.Image](s.db).Where("id = ?", parsedID).First(ctx)
}

// MarkAsSold soft-deletes a listing (marks it as sold)
func (s *ListingService) MarkAsSold(ctx context.Context, listingID uuid.UUID) error {
	_, err := gorm.G[models.Listing](s.db).
		Where("id = ?", listingID).
		Delete(ctx)
	return err
}

// RestoreListing restores a soft-deleted listing (un-sells it)
func (s *ListingService) RestoreListing(ctx context.Context, listingID uuid.UUID) error {
	return s.db.Unscoped().
		Model(&models.Listing{}).
		Where("id = ?", listingID).
		Update("deleted_at", nil).
		Error
}

func (s *ListingService) Update(ctx context.Context, listing *models.Listing, fields map[string]interface{}) error {
	return s.db.WithContext(ctx).Model(listing).Omit("Images", "Seller").Updates(fields).Error
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

func (s *ListingService) Delete(ctx context.Context, id string) error {
	parsedID, err := uuid.Parse(id)
	if err != nil {
		return err
	}
	return s.db.WithContext(ctx).Delete(&models.Listing{ID: parsedID}).Error
}
