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

func (s *OrderService) CreateFromInput(
	ctx context.Context,
	buyerID uuid.UUID,
	input CreateOrderInput,
) (*models.Order, error) {
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

	if err := gorm.G[models.Order](s.db).Create(ctx, &order); err != nil {
		return nil, err
	}

	return &order, nil
}

func (s *OrderService) GetByBuyerID(ctx context.Context, buyerID uuid.UUID) ([]models.Order, error) {
	return gorm.G[models.Order](s.db).
		Where("buyer_id = ?", buyerID).
		Order("purchased_at DESC").
		Find(ctx)
}
