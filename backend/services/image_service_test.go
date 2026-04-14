package services_test

import (
	"context"
	"errors"
	"testing"

	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func TestGetImageByID_Found(t *testing.T) {
	ctx := context.Background()
	imageService := services.NewImageService(db)

	result, err := imageService.GetImageByID(ctx, testImage.ID)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if result.ID != testImage.ID {
		t.Errorf("Expected image ID %v, got %v", testImage.ID, result.ID)
	}
	if result.OwnerID != testImage.OwnerID {
		t.Errorf("Expected owner ID %v, got %v", testImage.OwnerID, result.OwnerID)
	}
	if result.OwnerType != testImage.OwnerType {
		t.Errorf("Expected owner type %v, got %v", testImage.OwnerType, result.OwnerType)
	}
}

func TestGetImageByID_NotFound(t *testing.T) {
	ctx := context.Background()
	imageService := services.NewImageService(db)

	_, err := imageService.GetImageByID(ctx, uuid.New())
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Errorf("Expected %v, got %v", gorm.ErrRecordNotFound, err)
	}
}
