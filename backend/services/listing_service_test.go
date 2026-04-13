package services

import (
	"context"
	"testing"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
)

func TestListingService_MarkAsSold(t *testing.T) {
	db := setupTestDB(t)
	sellerUser := createTestUser(t, db, "seller@test.com")
	listing := createTestListing(t, db, sellerUser.ID)

	listingService := NewListingService(db)

	// Mark listing as sold
	err := listingService.MarkAsSold(context.Background(), listing.ID)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify listing is soft-deleted
	var foundListing models.Listing
	result := db.Where("id = ?", listing.ID).First(&foundListing)
	if result.RowsAffected > 0 {
		t.Errorf("Expected listing to be soft-deleted")
	}

	// Verify listing still exists when using Unscoped
	var unscopedListing models.Listing
	result = db.Unscoped().Where("id = ?", listing.ID).First(&unscopedListing)
	if result.Error != nil {
		t.Errorf("Expected listing to exist in database with deleted_at set: %v", result.Error)
	}

	if !unscopedListing.DeletedAt.Valid {
		t.Errorf("Expected deleted_at to be set")
	}
}

func TestListingService_RestoreListing(t *testing.T) {
	db := setupTestDB(t)
	sellerUser := createTestUser(t, db, "seller@test.com")
	listing := createTestListing(t, db, sellerUser.ID)

	listingService := NewListingService(db)

	// Mark as sold
	listingService.MarkAsSold(context.Background(), listing.ID)

	// Restore listing
	err := listingService.RestoreListing(context.Background(), listing.ID)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Verify listing is restored
	var restoredListing models.Listing
	result := db.Where("id = ?", listing.ID).First(&restoredListing)
	if result.Error != nil {
		t.Errorf("Expected listing to be found: %v", result.Error)
	}

	if restoredListing.DeletedAt.Valid {
		t.Errorf("Expected deleted_at to be nil after restore")
	}
}

func TestListingService_GetAll(t *testing.T) {
	db := setupTestDB(t)
	sellerUser := createTestUser(t, db, "seller@test.com")

	// Create multiple listings
	for i := 0; i < 5; i++ {
		createTestListing(t, db, sellerUser.ID)
	}

	listingService := NewListingService(db)
	listings, err := listingService.GetAll(context.Background(), 10, 0)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(listings) != 5 {
		t.Errorf("Expected 5 listings, got %d", len(listings))
	}
}

func TestListingService_GetAll_ExcludesDeleted(t *testing.T) {
	db := setupTestDB(t)
	sellerUser := createTestUser(t, db, "seller@test.com")

	// Create 3 listings
	listing1 := createTestListing(t, db, sellerUser.ID)
	listing2 := createTestListing(t, db, sellerUser.ID)
	createTestListing(t, db, sellerUser.ID)

	listingService := NewListingService(db)

	// Mark 2 as sold
	listingService.MarkAsSold(context.Background(), listing1.ID)
	listingService.MarkAsSold(context.Background(), listing2.ID)

	// Get all listings
	listings, err := listingService.GetAll(context.Background(), 10, 0)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(listings) != 1 {
		t.Errorf("Expected 1 active listing, got %d", len(listings))
	}
}

func TestListingService_Search(t *testing.T) {
	db := setupTestDB(t)
	sellerUser := createTestUser(t, db, "seller@test.com")

	// Create listings with specific titles
	listing1 := models.Listing{
		Title:       "iPhone 14",
		Description: "Apple phone",
		Price:       999.99,
		SellerID:    sellerUser.ID,
	}
	db.Create(&listing1)

	listing2 := models.Listing{
		Title:       "Samsung Galaxy",
		Description: "Android phone",
		Price:       799.99,
		SellerID:    sellerUser.ID,
	}
	db.Create(&listing2)

	listingService := NewListingService(db)
	results, err := listingService.Search(context.Background(), "title", "iPhone", 10, 0)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if len(results) != 1 {
		t.Errorf("Expected 1 result, got %d", len(results))
	}

	if results[0].Title != "iPhone 14" {
		t.Errorf("Expected iPhone 14, got %s", results[0].Title)
	}
}
