package services

import (
	"context"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderService struct {
	db             *gorm.DB
	listingService *ListingService
}

func NewOrderService(db *gorm.DB, listingService *ListingService) *OrderService {
	return &OrderService{
		db:             db,
		listingService: listingService,
	}
}

type CreateOrderRequest struct {
	ListingID uint
	BuyerID   uuid.UUID
}

// Create a new order for a listing
func (s *OrderService) Create(ctx context.Context, buyerID uuid.UUID, listingID uint) (*models.Order, error) {
	// Get the listing to retrieve seller info and price
	listing, err := gorm.G[models.Listing](s.db).Where("id = ?", listingID).First(ctx)
	if err != nil {
		return nil, err
	}

	order := &models.Order{
		BuyerID:   buyerID,
		SellerID:  listing.SellerID,
		ListingID: listingID,
		Price:     listing.Price,
		Status:    models.OrderStatusCompleted,
	}

	if err := gorm.G[models.Order](s.db).Create(ctx, order); err != nil {
		return nil, err
	}

	// Mark the listing as sold (soft delete)
	if err := s.listingService.MarkAsSold(ctx, listingID); err != nil {
		// Log error but don't fail the order creation
		return order, nil
	}

	return order, nil
}

// Get order by ID with all relations
func (s *OrderService) GetByID(ctx context.Context, id uint) (models.Order, error) {
	var order models.Order
	err := s.db.
		Preload("Buyer", nil).
		Preload("Seller", nil).
		Preload("Listing", func(db *gorm.DB) *gorm.DB {
			return db.Unscoped()
		}).
		Where("id = ?", id).
		First(&order).
		Error
	return order, err
}

// Get all orders for a buyer (order history)
func (s *OrderService) GetBuyerOrderHistory(ctx context.Context, buyerID uuid.UUID, limit int, offset int) ([]models.Order, error) {
	var orders []models.Order
	err := s.db.
		Preload("Buyer", nil).
		Preload("Seller", nil).
		Preload("Listing", func(db *gorm.DB) *gorm.DB {
			return db.Unscoped()
		}).
		Where("buyer_id = ?", buyerID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&orders).
		Error
	return orders, err
}

// Get all orders for a seller (sales history)
func (s *OrderService) GetSellerOrderHistory(ctx context.Context, sellerID uuid.UUID, limit int, offset int) ([]models.Order, error) {
	var orders []models.Order
	err := s.db.
		Preload("Buyer", nil).
		Preload("Seller", nil).
		Preload("Listing", func(db *gorm.DB) *gorm.DB {
			return db.Unscoped()
		}).
		Where("seller_id = ?", sellerID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&orders).
		Error
	return orders, err
}

// Get order count for a buyer
func (s *OrderService) GetBuyerOrderCount(ctx context.Context, buyerID uuid.UUID) (int64, error) {
	count, err := gorm.G[models.Order](s.db).
		Where("buyer_id = ?", buyerID).
		Count(ctx, "id")
	return count, err
}

// Update order status
func (s *OrderService) UpdateStatus(ctx context.Context, orderId uint, status models.OrderStatus) error {
	_, err := gorm.G[models.Order](s.db).
		Where("id = ?", orderId).
		Update(ctx, "status", status)
	return err
}

// Cancel an order
func (s *OrderService) Cancel(ctx context.Context, orderId uint) error {
	return s.UpdateStatus(ctx, orderId, models.OrderStatusCancelled)
}

// DeleteOrder removes an order from history and restores the listing
func (s *OrderService) DeleteOrder(ctx context.Context, orderId uint) error {
	// Get the order to retrieve listing ID
	order, err := s.GetByID(ctx, orderId)
	if err != nil {
		return err
	}

	// Soft-delete the order
	_, err = gorm.G[models.Order](s.db).
		Where("id = ?", orderId).
		Delete(ctx)
	if err != nil {
		return err
	}

	// Restore the listing so it appears in marketplace again
	if err := s.listingService.RestoreListing(ctx, order.ListingID); err != nil {
		// Log error but don't fail
		return nil
	}

	return nil
}
