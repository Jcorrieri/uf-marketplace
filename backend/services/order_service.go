package services

import (
	"context"
	"errors"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ErrSelfPurchase is returned when a user tries to buy their own listing.
var ErrSelfPurchase = errors.New("cannot purchase your own listing")

// ErrListingNotFound is returned when the target listing does not exist.
var ErrListingNotFound = errors.New("listing not found")

// OrderService handles all database operations related to orders/purchases.
type OrderService struct {
	db *gorm.DB
}

func NewOrderService(db *gorm.DB) *OrderService {
	return &OrderService{db: db}
}

// CreateOrder atomically validates the listing exists, snapshots data,
// and persists the order. It also deletes the listing after purchase.
func (s *OrderService) CreateOrder(ctx context.Context, buyerID uuid.UUID, listingID uuid.UUID) (*models.Order, error) {
	var order *models.Order

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Fetch the listing (including seller) to snapshot data.
		listing, err := gorm.G[models.Listing](tx).
			Preload("Seller", nil).
			Where("id = ?", listingID).
			First(ctx)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrListingNotFound
			}
			return err
		}

		// Snapshot data.
		o := models.Order{
			ListingID:    listing.ID,
			BuyerID:      buyerID,
			SellerID:     listing.SellerID,
			ListingTitle: listing.Title,
			Price:        listing.Price,
		}

		if err := gorm.G[models.Order](tx).Create(ctx, &o); err != nil {
			return err
		}

		// Remove the listing from the marketplace after purchase.
		if err := tx.Delete(&listing).Error; err != nil {
			return err
		}

		order = &o
		return nil
	})

	if err != nil {
		return nil, err
	}

	// Re-fetch with Buyer and Seller preloaded so GetResponse() works.
	full, err := gorm.G[models.Order](s.db).
		Preload("Buyer", nil).
		Preload("Seller", nil).
		Where("id = ?", order.ID).
		First(ctx)
	if err != nil {
		return nil, err
	}

	return &full, nil
}

// GetOrdersByBuyerID returns all purchase orders placed by the given user.
func (s *OrderService) GetOrdersByBuyerID(ctx context.Context, buyerID uuid.UUID) ([]models.Order, error) {
	return gorm.G[models.Order](s.db).
		Preload("Buyer", nil).
		Preload("Seller", nil).
		Where("buyer_id = ?", buyerID).
		Order("created_at DESC").
		Find(ctx)
}

// GetOrdersBySellerID returns all sale orders where the given user was the seller.
func (s *OrderService) GetOrdersBySellerID(ctx context.Context, sellerID uuid.UUID) ([]models.Order, error) {
	return gorm.G[models.Order](s.db).
		Preload("Buyer", nil).
		Preload("Seller", nil).
		Where("seller_id = ?", sellerID).
		Order("created_at DESC").
		Find(ctx)
}
