package services

import (
	"context"
	"errors"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ImageService struct {
	db *gorm.DB
}

func NewImageService(db *gorm.DB) *ImageService {
	return &ImageService{db: db}
}

// Global function to preload only image IDs for listings (users, listings)
// See https://gorm.io/docs/preload.html
func ImageIDsOnly(db gorm.PreloadBuilder) error {
	db.Select("id", "owner_id", "owner_type").Order("position asc")
	return nil
}

func (s *ImageService) GetImageByID(ctx context.Context, imageID uuid.UUID) (models.Image, error) {
	return gorm.G[models.Image](s.db).Where("id = ?", imageID).First(ctx)
}

type CreateImageRequest struct {
	OwnerID uuid.UUID
	OwnerType string	
	Data []byte
	MimeType string
	Position int
}

func (s *ImageService) Create(ctx context.Context, request CreateImageRequest) (*models.Image, error) {
	image := models.Image{
		OwnerID: request.OwnerID,
		OwnerType: request.OwnerType,
		Data: request.Data,
		MimeType: request.MimeType,
		Position: request.Position,
	}

	if err := gorm.G[models.Image](s.db).Create(ctx, &image); err != nil {
		return nil, err
	}

	return &image, nil
}

func (s *ImageService) CreateInBatches(ctx context.Context, batch []CreateImageRequest) error {
	batchSize := len(batch)	
	if batchSize <= 0 {
		return errors.New("Batch length must be > 0.")
	}

	var images []models.Image
	for _, request := range batch {
		images = append(images, models.Image{
			OwnerID: request.OwnerID,
			OwnerType: request.OwnerType,
			Data: request.Data,
			MimeType: request.MimeType,
			Position: request.Position,
		})
	}

	err := gorm.G[models.Image](s.db).CreateInBatches(ctx, &images, batchSize)
	if err != nil {
		return err
	}

	return nil
}

func (s *ImageService) DeleteAllByOwner(ctx context.Context, ownerID uuid.UUID) error {
	// Permanently Deletes Images (Bypasses soft-delete)
	_, err := gorm.G[models.Image](s.db).
	Scopes( func(stmt *gorm.Statement) { stmt.Unscoped = true } ).
	Where("owner_id = ? AND owner_type = ?", ownerID, "listings").
	Delete(ctx)

	if err != nil {
		return err
	}

	return nil
}
