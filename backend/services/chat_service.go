package services

import (
	"context"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChatService struct {
	db *gorm.DB
}

func NewChatService(db *gorm.DB) *ChatService {
	return &ChatService{db: db}
}

// GetOrCreateConversation finds an existing conversation for a (buyer, listing) pair,
// or creates one if none exists. Prevents duplicate chat rooms.
func (s *ChatService) GetOrCreateConversation(
	ctx context.Context,
	buyerID uuid.UUID,
	sellerID uuid.UUID,
	listingID uuid.UUID,
) (models.Conversation, error) {

	// Try to find an existing conversation first
	existing, err := gorm.G[models.Conversation](s.db).
		Preload("Buyer", nil).
		Preload("Seller", nil).
		Preload("Listing", nil).
		Where("buyer_id = ? AND listing_id = ?", buyerID, listingID).
		First(ctx)

	if err == nil {
		return existing, nil
	}

	if err != gorm.ErrRecordNotFound {
		return models.Conversation{}, err
	}

	// None found — create a new one
	convo := models.Conversation{
		BuyerID:   buyerID,
		SellerID:  sellerID,
		ListingID: listingID,
	}

	if err := gorm.G[models.Conversation](s.db).Create(ctx, &convo); err != nil {
		return models.Conversation{}, err
	}

	// Re-fetch with preloads so GetResponse() has the data it needs
	return gorm.G[models.Conversation](s.db).
		Preload("Buyer", nil).
		Preload("Seller", nil).
		Preload("Listing", nil).
		Where("id = ?", convo.ID).
		First(ctx)
}

// GetUserConversations returns all conversations where the user is buyer or seller.
func (s *ChatService) GetUserConversations(
	ctx context.Context,
	userID uuid.UUID,
) ([]models.Conversation, error) {

	return gorm.G[models.Conversation](s.db).
		Preload("Buyer", nil).
		Preload("Seller", nil).
		Preload("Listing", nil).
		Preload("Messages", nil).
		Where("buyer_id = ? OR seller_id = ?", userID, userID).
		Order("updated_at DESC").
		Find(ctx)
}

// GetByID fetches a single conversation with all relations loaded.
func (s *ChatService) GetByID(
	ctx context.Context,
	conversationID uuid.UUID,
) (models.Conversation, error) {

	return gorm.G[models.Conversation](s.db).
		Preload("Buyer", nil).
		Preload("Seller", nil).
		Preload("Listing", nil).
		Where("id = ?", conversationID).
		First(ctx)
}

// GetMessages returns all messages in a conversation, oldest first.
func (s *ChatService) GetMessages(
	ctx context.Context,
	conversationID uuid.UUID,
) ([]models.Message, error) {

	return gorm.G[models.Message](s.db).
		Preload("Sender", nil).
		Where("conversation_id = ?", conversationID).
		Order("created_at ASC").
		Find(ctx)
}

// SaveMessage persists a new message to the DB.
func (s *ChatService) SaveMessage(
	ctx context.Context,
	msg *models.Message,
) error {
	return gorm.G[models.Message](s.db).Create(ctx, msg)
}
