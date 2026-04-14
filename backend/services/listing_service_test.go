package services_test

import (
	"context"
	"testing"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/google/uuid"
)

var testListing models.Listing

// ── NewListingService ────────────────────────────────────────────────────────

func TestNewListingService_NotNil(t *testing.T) {
	svc := services.NewListingService(db)
	if svc == nil {
		t.Error("Expected non-nil ListingService")
	}
}

// ── Create ───────────────────────────────────────────────────────────────────

func TestCreateListing(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	listing := &models.Listing{
		Title:       "Test Textbook",
		Description: "A test listing",
		Price:       9.99,
		SellerID:    testUser.ID,

	}

	err := svc.Create(ctx, listing)
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

	result, err := svc.GetByID(ctx, testListing.ID.String())
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

	_, err := svc.GetByID(ctx, uuid.New().String())
	if err == nil {
		t.Error("Expected error, got nil")
	}
}

func TestGetListingByID_InvalidID(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	_, err := svc.GetByID(ctx, "not-a-valid-uuid")
	if err == nil {
		t.Error("Expected error for invalid ID, got nil")
	}
}

// ── GetAll ───────────────────────────────────────────────────────────────────

func TestGetAll_ReturnsResults(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	results, err := svc.GetAll(ctx, 10, "")
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

	results, err := svc.GetAll(ctx, 2, "")
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

	firstPage, err := svc.GetAll(ctx, 1, "")
	if err != nil {
		t.Fatalf("Expected no error on first page, got %v", err)
	}
	if len(firstPage) == 0 {
		t.Fatal("Expected at least one result on first page")
	}

	cursor := firstPage[0].ID.String()
	secondPage, err := svc.GetAll(ctx, 10, cursor)
	if err != nil {
		t.Fatalf("Expected no error on second page, got %v", err)
	}
	for _, l := range secondPage {
		if l.ID.String() >= cursor {
			t.Errorf("Expected all results to have ID less than cursor %v, got %v", cursor, l.ID)
		}
	}
}

// ── GetBySellerID ─────────────────────────────────────────────────────────────

func TestGetBySellerID_Found(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	results, err := svc.GetBySellerID(ctx, testUser.ID.String())
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

	results, err := svc.GetBySellerID(ctx, uuid.New().String())
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

	results, err := svc.Search(ctx, "title", "Textbook", 10, "")
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

	results, err := svc.Search(ctx, "title", "zzznomatchzzz", 10, "")
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}
	if len(results) != 0 {
		t.Errorf("Expected no results, got %d", len(results))
	}
}

// ── Update ───────────────────────────────────────────────────────────────────

func TestUpdateListing(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	err := svc.Update(ctx, &testListing, map[string]any{
		"title": "Updated Title",
		"price": 19.99,
	})
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	result, err := svc.GetByID(ctx, testListing.ID.String())
	if err != nil {
		t.Fatalf("Expected no error fetching updated listing, got %v", err)
	}
	if result.Title != "Updated Title" {
		t.Errorf("Expected title 'Updated Title', got %v", result.Title)
	}
	if result.Price != 19.99 {
		t.Errorf("Expected price 19.99, got %v", result.Price)
	}
}

// ── ReplaceImages ─────────────────────────────────────────────────────────────

func TestReplaceImages(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	newImages := []models.Image{
		{OwnerID: testListing.ID, OwnerType: "listings", Data: []byte{}, MimeType: "image/jpeg", Position: 0},
		{OwnerID: testListing.ID, OwnerType: "listings", Data: []byte{}, MimeType: "image/jpeg", Position: 1},
	}

	err := svc.ReplaceImages(ctx, testListing.ID, newImages)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	result, err := svc.GetByID(ctx, testListing.ID.String())
	if err != nil {
		t.Fatalf("Expected no error fetching listing, got %v", err)
	}
	if len(result.Images) != 2 {
		t.Errorf("Expected 2 images, got %d", len(result.Images))
	}
}

func TestReplaceImages_ClearsExisting(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	err := svc.ReplaceImages(ctx, testListing.ID, []models.Image{})
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	result, err := svc.GetByID(ctx, testListing.ID.String())
	if err != nil {
		t.Fatalf("Expected no error fetching listing, got %v", err)
	}
	if len(result.Images) != 0 {
		t.Errorf("Expected 0 images after clear, got %d", len(result.Images))
	}
}

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

	err := svc.Delete(ctx, listing.ID.String())
	if err != nil {
		t.Fatalf("Expected no error on delete, got %v", err)
	}

	_, err = svc.GetByID(ctx, listing.ID.String())
	if err == nil {
		t.Error("Expected error fetching deleted listing, got nil")
	}
}

func TestDeleteListing_InvalidID(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	err := svc.Delete(ctx, "not-a-valid-uuid")
	if err == nil {
		t.Error("Expected error for invalid UUID, got nil")
	}
}

func TestDeleteListing_NotFound(t *testing.T) {
	ctx := context.Background()
	svc := services.NewListingService(db)

	// GORM soft delete does not error on a missing record
	err := svc.Delete(ctx, uuid.New().String())
	if err != nil {
		t.Errorf("Expected no error for missing record, got %v", err)
	}
}
