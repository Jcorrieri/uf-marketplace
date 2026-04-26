package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Conversation links a buyer, a seller, and a listing together.
// Only one conversation can exist per (buyer, listing) pair.
type Conversation struct {
	ID        uuid.UUID `json:"id" gorm:"primaryKey"`
	ListingID uuid.UUID `json:"listing_id" gorm:"type:uuid;index"`
	Listing   Listing   `json:"-" gorm:"foreignKey:ListingID"`
	BuyerID   uuid.UUID `json:"buyer_id" gorm:"type:uuid;index"`
	Buyer     User      `json:"-" gorm:"foreignKey:BuyerID"`
	SellerID  uuid.UUID `json:"seller_id" gorm:"type:uuid;index"`
	Seller    User      `json:"-" gorm:"foreignKey:SellerID"`
	Messages  []Message `json:"messages,omitempty" gorm:"foreignKey:ConversationID;constraint:OnDelete:CASCADE"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

func (c *Conversation) BeforeCreate(tx *gorm.DB) error {
	id, err := uuid.NewV7()
	c.ID = id
	return err
}

type ConversationResponse struct {
	ID           uuid.UUID `json:"id"`
	ListingID    uuid.UUID `json:"listing_id"`
	ListingTitle string    `json:"listing_title"`
	BuyerID      uuid.UUID `json:"buyer_id"`
	BuyerName    string    `json:"buyer_name"`
	SellerID     uuid.UUID `json:"seller_id"`
	SellerName   string    `json:"seller_name"`
	LastMessage  string    `json:"last_message"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (c *Conversation) GetResponse() ConversationResponse {
	lastMsg := ""
	if len(c.Messages) > 0 {
		lastMsg = c.Messages[len(c.Messages)-1].Content
	}
	return ConversationResponse{
		ID:           c.ID,
		ListingID:    c.ListingID,
		ListingTitle: c.Listing.Title,
		BuyerID:      c.BuyerID,
		BuyerName:    c.Buyer.FirstName + " " + c.Buyer.LastName,
		SellerID:     c.SellerID,
		SellerName:   c.Seller.FirstName + " " + c.Seller.LastName,
		LastMessage:  lastMsg,
		UpdatedAt:    c.UpdatedAt,
	}
}

// Message belongs to a Conversation and is sent by one user.
type Message struct {
	ID             uuid.UUID      `json:"id" gorm:"primaryKey"`
	ConversationID uuid.UUID      `json:"conversation_id" gorm:"type:uuid;index"`
	SenderID       uuid.UUID      `json:"sender_id" gorm:"type:uuid;index"`
	Sender         User           `json:"-" gorm:"foreignKey:SenderID"`
	Content        string         `json:"content"`
	CreatedAt      time.Time      `json:"created_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index"`
}

func (m *Message) BeforeCreate(tx *gorm.DB) error {
	id, err := uuid.NewV7()
	m.ID = id
	return err
}

type MessageResponse struct {
	ID             uuid.UUID `json:"id"`
	ConversationID uuid.UUID `json:"conversation_id"`
	SenderID       uuid.UUID `json:"sender_id"`
	SenderName     string    `json:"sender_name"`
	Content        string    `json:"content"`
	CreatedAt      time.Time `json:"created_at"`
}

func (m *Message) GetResponse() MessageResponse {
	return MessageResponse{
		ID:             m.ID,
		ConversationID: m.ConversationID,
		SenderID:       m.SenderID,
		SenderName:     m.Sender.FirstName + " " + m.Sender.LastName,
		Content:        m.Content,
		CreatedAt:      m.CreatedAt,
	}
}
