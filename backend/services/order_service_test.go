package services

import (
	"context"
	"testing"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// Auto migrate models
	err = db.AutoMigrate(
		&models.User{},
		&models.Listing{},
		&models.Order{},
	)
	if err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}

func createTestUser(t *testing.T, db *gorm.DB, email string) models.User {
	user := models.User{
		Email:        email,
		PasswordHash: "hashed_password",
		FirstName:    "Test",
		LastName:     "User",
	}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}
	return user
}

func createTestListing(t *testing.T, db *gorm.DB, sellerID uuid.UUID) models.Listing {
	listing := models.Listing{
		Title:       "Test Item",
		Description: "A test item",
		Price:       99.99,
		SellerID:    sellerID,
	}
	if err := db.Create(&listing).Error; err != nil {
		t.Fatalf("Failed to create test listing: %v", err)
	}
	return listing
}

func TestOrderService_Create(t *testing.T) {
	db := setupTestDB(t)
	buyerUser := createTestUser(t, db, "buyer@test.com")
	sellerUser := createTestUser(t, db, "seller@test.com")
	listing := createTestListing(t, db, sellerUser.ID)

	listingService := NewListingService(db)
	orderService := NewOrderService(db, listingService)

	order, err := orderService.Create(context.Background(), buyerUser.ID, listing.ID)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if order == nil {
		t.Errorf("Expected order to be created, got nil")
	}

	if order.BuyerID != buyerUser.ID {
		t.Errorf("Expected buyer ID %v, got %v", buyerUser.ID, order.BuyerID)
	}

	if order.SellerID != sellerUser.ID {
		t.Errorf("Expected seller ID %v, got %v", sellerUser.ID, order.SellerID)
	}

	if order.Price != listing.Price {
		t.Errorf("Expected price %f, got %f", listing.Price, order.Price)
	}

	// Verify listing is soft-deleted
	var deletedListing models.Listing
	result := db.Where("id = ?", listing.ID).First(&deletedListing)
	if result.RowsAffected > 0 {
		t.Errorf("Expected listing to be soft-deleted but found it")
	}
}

func TestOrderService_GetByID(t *testing.T) {
	db := setupTestDB(t)
	buyerUser := createTestUser(t, db, "buyer@test.com")
	sellerUser := createTestUser(t, db, "seller@test.com")
	listing := createTestListing(t, db, sellerUser.ID)

	listingService := NewListingService(db)
	orderService := NewOrderService(db, listingService)

	// Create order
	createdOrder, _ := orderService.Create(context.Background(), buyerUser.ID, listing.ID)

	// Restore listing for retrieval
	db.Unscoped().Model(&models.Listing{}).Where("id = ?", listing.ID).Update("deleted_at", nil)

	// Get order
	retrievedOrder, err := orderService.GetByID(context.Background(), createdOrder.ID)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if retrievedOrder.ID != createdOrder.ID {
		t.Errorf("Expected order ID %d, got %d", createdOrder.ID, retrievedOrder.ID)
	}
}

func TestOrderService_GetBuyerOrderHistory(t *testing.T) {
	db := setupTestDB(t)
	buyerUser := createTestUser(t, db, "buyer@test.com")
	sellerUser := createTestUser(t, db, "seller@test.com")

	// Create multiple listings and orders
	for i := 0; i < 3; i++ {
		listing := createTestListing(t, db, sellerUser.ID)
		listingService := NewListingService(db)
		orderService := NewOrderService(db, listingService)
		orderService.Create(context.Background(), buyerUser.ID, listing.ID)
	}

	listingService := NewListingService(db)
	orderService := NewOrderService(db, listingService)
	orders, err := orderService.GetBuyerOrderHistory(context.Background(), buyerUser.ID, 10, 0)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(orders) != 3 {
		t.Errorf("Expected 3 orders, got %d", len(orders))
	}
}

func TestOrderService_UpdateStatus(t *testing.T) {
	db := setupTestDB(t)
	buyerUser := createTestUser(t, db, "buyer@test.com")
	sellerUser := createTestUser(t, db, "seller@test.com")
	listing := createTestListing(t, db, sellerUser.ID)

	listingService := NewListingService(db)
	orderService := NewOrderService(db, listingService)

	order, _ := orderService.Create(context.Background(), buyerUser.ID, listing.ID)

	// Update status to cancelled
	err := orderService.UpdateStatus(context.Background(), order.ID, models.OrderStatusCancelled)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify status was updated
	updatedOrder, _ := orderService.GetByID(context.Background(), order.ID)
	if updatedOrder.Status != models.OrderStatusCancelled {
		t.Errorf("Expected status %s, got %s", models.OrderStatusCancelled, updatedOrder.Status)
	}
}

func TestOrderService_DeleteOrder(t *testing.T) {
	db := setupTestDB(t)
	buyerUser := createTestUser(t, db, "buyer@test.com")
	sellerUser := createTestUser(t, db, "seller@test.com")
	listing := createTestListing(t, db, sellerUser.ID)

	listingService := NewListingService(db)
	orderService := NewOrderService(db, listingService)

	order, _ := orderService.Create(context.Background(), buyerUser.ID, listing.ID)

	// Delete order
	err := orderService.DeleteOrder(context.Background(), order.ID)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify listing is restored
	var restoredListing models.Listing
	result := db.Unscoped().Where("id = ?", listing.ID).First(&restoredListing)
	if result.Error != nil {
		t.Errorf("Expected listing to be found, got error: %v", result.Error)
	}

	if restoredListing.DeletedAt.Valid {
		t.Errorf("Expected listing to be restored (deleted_at = nil)")
	}
}

func TestOrderService_Cancel(t *testing.T) {
	db := setupTestDB(t)
	buyerUser := createTestUser(t, db, "buyer@test.com")
	sellerUser := createTestUser(t, db, "seller@test.com")
	listing := createTestListing(t, db, sellerUser.ID)

	listingService := NewListingService(db)
	orderService := NewOrderService(db, listingService)

	order, _ := orderService.Create(context.Background(), buyerUser.ID, listing.ID)

	// Cancel order
	err := orderService.Cancel(context.Background(), order.ID)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify order status is cancelled
	cancelledOrder, _ := orderService.GetByID(context.Background(), order.ID)
	if cancelledOrder.Status != models.OrderStatusCancelled {
		t.Errorf("Expected status %s, got %s", models.OrderStatusCancelled, cancelledOrder.Status)
	}
}
