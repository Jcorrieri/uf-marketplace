package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestOrderHandler(t *testing.T) (*OrderHandler, *gorm.DB) {
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

	listingService := services.NewListingService(db)
	orderService := services.NewOrderService(db, listingService)
	handler := NewOrderHandler(orderService)

	return handler, db
}

func createTestUserWithDB(t *testing.T, db *gorm.DB, email string) models.User {
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

func createTestListingWithDB(t *testing.T, db *gorm.DB, sellerID uuid.UUID) models.Listing {
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

func TestOrderHandler_CreateOrder(t *testing.T) {
	handler, db := setupTestOrderHandler(t)
	gin.SetMode(gin.TestMode)

	buyerUser := createTestUserWithDB(t, db, "buyer@test.com")
	sellerUser := createTestUserWithDB(t, db, "seller@test.com")
	listing := createTestListingWithDB(t, db, sellerUser.ID)

	// Create request body
	body := map[string]interface{}{
		"listing_id": listing.ID,
	}
	jsonBody, _ := json.Marshal(body)

	// Create request
	req, _ := http.NewRequest("POST", "/api/orders", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	// Create context
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("userID", buyerUser.ID.String())
	c.Params = gin.Params{}

	// Call handler
	handler.CreateOrder(c)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d", w.Code)
	}

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	if response["listing_name"] != "Test Item" {
		t.Errorf("Expected listing_name to be 'Test Item', got %v", response["listing_name"])
	}
}

func TestOrderHandler_GetMyOrders(t *testing.T) {
	handler, db := setupTestOrderHandler(t)
	gin.SetMode(gin.TestMode)

	buyerUser := createTestUserWithDB(t, db, "buyer@test.com")
	sellerUser := createTestUserWithDB(t, db, "seller@test.com")

	// Create orders
	listingService := services.NewListingService(db)
	orderService := services.NewOrderService(db, listingService)
	listing1 := createTestListingWithDB(t, db, sellerUser.ID)
	listing2 := createTestListingWithDB(t, db, sellerUser.ID)

	orderService.Create(context.Background(), buyerUser.ID, listing1.ID)
	orderService.Create(context.Background(), buyerUser.ID, listing2.ID)

	// Create request
	req, _ := http.NewRequest("GET", "/api/orders/buyer/me", nil)

	// Create context
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("userID", buyerUser.ID.String())

	// Call handler
	handler.GetMyOrders(c)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	if count, ok := response["count"].(float64); !ok || count != 2 {
		t.Errorf("Expected 2 orders, got %v", response["count"])
	}
}

func TestOrderHandler_CancelOrder(t *testing.T) {
	handler, db := setupTestOrderHandler(t)
	gin.SetMode(gin.TestMode)

	buyerUser := createTestUserWithDB(t, db, "buyer@test.com")
	sellerUser := createTestUserWithDB(t, db, "seller@test.com")
	listing := createTestListingWithDB(t, db, sellerUser.ID)

	listingService := services.NewListingService(db)
	orderService := services.NewOrderService(db, listingService)
	order, _ := orderService.Create(context.Background(), buyerUser.ID, listing.ID)

	// Create request
	req, _ := http.NewRequest("PUT", fmt.Sprintf("/api/orders/%d/cancel", order.ID), nil)

	// Create context
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("userID", buyerUser.ID.String())
	c.Params = gin.Params{gin.Param{Key: "id", Value: fmt.Sprintf("%d", order.ID)}}

	// Call handler
	handler.CancelOrder(c)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}

func TestOrderHandler_DeleteOrder(t *testing.T) {
	handler, db := setupTestOrderHandler(t)
	gin.SetMode(gin.TestMode)

	buyerUser := createTestUserWithDB(t, db, "buyer@test.com")
	sellerUser := createTestUserWithDB(t, db, "seller@test.com")
	listing := createTestListingWithDB(t, db, sellerUser.ID)

	listingService := services.NewListingService(db)
	orderService := services.NewOrderService(db, listingService)
	order, _ := orderService.Create(context.Background(), buyerUser.ID, listing.ID)

	// Create request
	req, _ := http.NewRequest("DELETE", fmt.Sprintf("/api/orders/%d", order.ID), nil)

	// Create context
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Set("userID", buyerUser.ID.String())
	c.Params = gin.Params{gin.Param{Key: "id", Value: fmt.Sprintf("%d", order.ID)}}

	// Call handler
	handler.DeleteOrder(c)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}

func TestOrderHandler_GetOrder_NotFound(t *testing.T) {
	handler, _ := setupTestOrderHandler(t)
	gin.SetMode(gin.TestMode)

	// Create request for non-existent order
	req, _ := http.NewRequest("GET", "/api/orders/999", nil)

	// Create context
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	c.Params = gin.Params{gin.Param{Key: "id", Value: "999"}}

	// Call handler
	handler.GetOrder(c)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", w.Code)
	}
}
