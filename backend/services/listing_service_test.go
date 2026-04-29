package services_test

import (
	"context"
	"errors"
	"testing"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var testListing models.Listing

// ── Create ───────────────────────────────────────────────────────────────────

func TestCreateListing(t *testing.T) {
	ctx := context.Background()
	service := services.NewListingService(db)

	listing := &models.Listing{
		Title:       "Test Textbook",
		Description: "A test listing",
		Price:       9.99,
		SellerID:    testUser.ID,

	}

	err := service.Create(ctx, listing)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if listing.ID == uuid.Nil {
		t.Error("Expected listing to have an ID after creation")
	}

	testListing = *listing
}

// ── GetByID ──────────────────────────────────────────────────────────────────

func TestGetListingByID_Found(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	result, err := svc.GetByID(ctx, testListing.ID)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if result.ID != testListing.ID {
		t.Errorf("Expected listing ID %v, got %v", testListing.ID, result.ID)
	}
	if result.Title != testListing.Title {
		t.Errorf("Expected title %v, got %v", testListing.Title, result.Title)
	}
}

func TestGetListingByID_NotFound(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	_, err := svc.GetByID(ctx, uuid.New())
	if err == nil {
		t.Error("Expected error, got nil")
	}
}

func TestGetListingByID_InvalidID(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	_, err := svc.GetByID(ctx, uuid.Nil)
	if err == nil {
		t.Error("Expected error for invalid ID, got nil")
	}
}

// ── GetAll ───────────────────────────────────────────────────────────────────

func TestGetAll_ReturnsResults(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	results, err := svc.GetAll(ctx, 10, uuid.Nil)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if len(results) == 0 {
		t.Error("Expected at least one listing, got none")
	}
}

func TestGetAll_LimitIsRespected(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	// Create extra listings to ensure limit is meaningful
	for range 3 {
		_ = svc.Create(ctx, &models.Listing{
			Title:    "Extra Listing",
			Price:    1.00,
			SellerID: testUser.ID,
		})
	}

	results, err := svc.GetAll(ctx, 2, uuid.Nil)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if len(results) > 2 {
		t.Errorf("Expected at most 2 results, got %d", len(results))
	}
}

func TestGetAll_CursorPagination(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	firstPage, err := svc.GetAll(ctx, 1, uuid.Nil)
	if err != nil {
		t.Fatalf("Expected no error on first page, got %v", err)
	}
	if len(firstPage) == 0 {
		t.Fatal("Expected at least one result on first page")
	}

	cursor := firstPage[0].ID
	secondPage, err := svc.GetAll(ctx, 10, cursor)
	if err != nil {
		t.Fatalf("Expected no error on second page, got %v", err)
	}
	for _, l := range secondPage {
		if l.ID.String() >= cursor.String() {
			t.Errorf("Expected all results to have ID less than cursor %v, got %v", cursor, l.ID)
		}
	}
}

// ── GetBySellerID ─────────────────────────────────────────────────────────────

func TestGetBySellerID_Found(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	results, err := svc.GetBySellerID(ctx, testUser.ID)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if len(results) == 0 {
		t.Error("Expected at least one listing for test seller")
	}
	for _, l := range results {
		if l.SellerID != testUser.ID {
			t.Errorf("Expected seller ID %v, got %v", testUser.ID, l.SellerID)
		}
	}
}

func TestGetBySellerID_NoResults(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	results, err := svc.GetBySellerID(ctx, uuid.New())
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if len(results) != 0 {
		t.Errorf("Expected no listings, got %d", len(results))
	}
}

// ── Search ───────────────────────────────────────────────────────────────────

func TestSearch_MatchingQuery(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	results, err := svc.Search(ctx, "title", "Textbook", 10, uuid.Nil)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if len(results) == 0 {
		t.Error("Expected at least one result for matching query")
	}
}

func TestSearch_NoMatch(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	results, err := svc.Search(ctx, "title", "zzznomatchzzz", 10, uuid.Nil)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if len(results) != 0 {
		t.Errorf("Expected no results, got %d", len(results))
	}
}

// ── Update ───────────────────────────────────────────────────────────────────

// func TestUpdateListing(t *testing.T) {
// 	ctx := context.Background()
// 	svc := services.NewListingService(db)
//
// 	_, err := svc.Update(ctx, &testListing, map[string]any{
// 		"title": "Updated Title",
// 		"price": 19.99,
// 	})
// 	if err != nil {
// 		t.Fatalf("Expected no error, got %v", err)
// 	}
//
// 	result, err := svc.GetByID(ctx, testListing.ID)
// 	if err != nil {
// 		t.Fatalf("Expected no error fetching updated listing, got %v", err)
// 	}
// 	if result.Title != "Updated Title" {
// 		t.Errorf("Expected title 'Updated Title', got %v", result.Title)
// 	}
// 	if result.Price != 19.99 {
// 		t.Errorf("Expected price 19.99, got %v", result.Price)
// 	}
// }

// ── Delete ───────────────────────────────────────────────────────────────────

func TestDeleteListing(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	listing := &models.Listing{
		Title:    "To Be Deleted",
		Price:    5.00,
		SellerID: testUser.ID,
	}
	if err := svc.Create(ctx, listing); err != nil {
		t.Fatalf("Setup failed: %v", err)
	}

	err := svc.Delete(ctx, listing.ID)
	if err != nil {
		t.Fatalf("Expected no error on delete, got %v", err)
	}

	_, err = svc.GetByID(ctx, listing.ID)
	if err == nil {
		t.Error("Expected error fetching deleted listing, got nil")
	}
}

func TestDeleteListing_InvalidID(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	err := svc.Delete(ctx, uuid.Nil)
	if err == nil {
		t.Error("Expected error for invalid UUID, got nil")
	}
}

func TestDeleteListing_NotFound(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	err := svc.Delete(ctx, uuid.Nil)
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Errorf("Expected error for missing record")
	}
}
