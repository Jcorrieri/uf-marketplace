package services

import (
	"context"
	"time"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderService struct {
	db *gorm.DB
}

func NewOrderService(db *gorm.DB) *OrderService {
	return &OrderService{db: db}
}

// CreateFromListing creates an order from a Listing model (server-side data)
func (s *OrderService) CreateFromListing(
	ctx context.Context,
	buyerID uuid.UUID,
	listing *models.Listing,
) (*models.Order, error) {
	var createdOrder *models.Order

	// Use transaction to ensure both order creation and listing status update succeed together
	err := s.db.Transaction(func(tx *gorm.DB) error {
		// Double-check listing is still available inside transaction to prevent race conditions
		currentListing, err := gorm.G[models.Listing](tx).Where("id = ?", listing.ID).First(ctx)
		if err != nil {
			return err
		}

		if currentListing.Status != "available" {
			return gorm.ErrRecordNotFound // Will be caught as 409 Conflict in handler
		}

		// Verify listing.Seller is loaded (defensive check)
		if listing.Seller.ID == uuid.Nil {
			return gorm.ErrRecordNotFound
		}

		order := models.Order{
			BuyerID:      buyerID,
			ListingID:    listing.ID,
			Title:        listing.Title,
			Description:  listing.Description,
			Price:        listing.Price,
			FirstImageID: nil, // Will be set from images if available
			SellerName:   listing.Seller.FirstName + " " + listing.Seller.LastName,
			Status:       "Completed",
			PurchasedAt:  time.Now().UTC(),
		}

		// Set first image ID if available
		if len(listing.Images) > 0 {
			order.FirstImageID = &listing.Images[0].ID
		}

		if err := gorm.G[models.Order](tx).Create(ctx, &order); err != nil {
			return err
		}

		// Mark the listing as sold
		rowsAffected, err := gorm.G[models.Listing](tx).Where("id = ?", listing.ID).Update(ctx, "status", "sold")
		if err != nil {
			return err
		}

		if rowsAffected == 0 {
			return gorm.ErrRecordNotFound // Listing doesn't exist
		}

		createdOrder = &order
		return nil
	})

	if err != nil {
		return nil, err
	}

	return createdOrder, nil
}

func (s *OrderService) GetByBuyerID(ctx context.Context, buyerID uuid.UUID) ([]models.Order, error) {
	return gorm.G[models.Order](s.db).
		Where("buyer_id = ?", buyerID).
		Order("purchased_at DESC").
		Find(ctx)
}
