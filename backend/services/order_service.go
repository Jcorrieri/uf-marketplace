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

type CreateOrderInput struct {
	ListingID    uuid.UUID
	Title        string
	Description  string
	Price        float64
	FirstImageID *uuid.UUID
	SellerName   string
}

// CreateFromListing creates an order from a Listing model (server-side data)
func (s *OrderService) CreateFromListing(
	ctx context.Context,
	buyerID uuid.UUID,
	listing *models.Listing,
) (*models.Order, error) {
	var createdOrder *models.Order

	// Use transaction to ensure both order creation and listing status update succeed together
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
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

		if err := tx.Create(&order).Error; err != nil {
			return err
		}

		// Mark the listing as sold
		if err := tx.Model(&models.Listing{}).Where("id = ?", listing.ID).Update("status", "sold").Error; err != nil {
			return err
		}

		createdOrder = &order
		return nil
	})

	if err != nil {
		return nil, err
	}

	return createdOrder, nil
}

// CreateFromInput creates an order from client input (kept for backward compatibility)
func (s *OrderService) CreateFromInput(
	ctx context.Context,
	buyerID uuid.UUID,
	input CreateOrderInput,
) (*models.Order, error) {
	var createdOrder *models.Order

	// Use transaction to ensure both order creation and listing status update succeed together
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		order := models.Order{
			BuyerID:      buyerID,
			ListingID:    input.ListingID,
			Title:        input.Title,
			Description:  input.Description,
			Price:        input.Price,
			FirstImageID: input.FirstImageID,
			SellerName:   input.SellerName,
			Status:       "Processing",
			PurchasedAt:  time.Now().UTC(),
		}

		if err := tx.Create(&order).Error; err != nil {
			return err
		}

		// Mark the listing as sold
		if err := tx.Model(&models.Listing{}).Where("id = ?", input.ListingID).Update("status", "sold").Error; err != nil {
			return err
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
