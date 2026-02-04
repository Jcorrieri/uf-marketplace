package services

import (
	"context"
	"github.com/Jcorrieri/uf-marketplace/backend/models"

	"gorm.io/gorm"
)

// Define the service struct whose only dependency is the db connection.
// Services will handle all database operations for each model (users, posts, etc.).
// See https://gorm.io/docs/the_generics_way.html for generics API usage.
type BookService struct {
	db *gorm.DB
}

func NewBookService(db *gorm.DB) *BookService {
	return &BookService{db: db}
}

func (s *BookService) GetAll(ctx context.Context) ([]models.Book, error) {
	// Use gorm.G[model.<model>]()... to get built-in type safety
	return gorm.G[models.Book](s.db).Find(ctx)
}

func (s *BookService) Get(ctx context.Context, id uint) (models.Book, error) {
	return gorm.G[models.Book](s.db).Where("id = ?", id).First(ctx)
}

func (s *BookService) Create(ctx context.Context, book *models.Book) error {
	return gorm.G[models.Book](s.db).Create(ctx, book)
}

func (s *BookService) Delete(ctx context.Context, id uint) error {
	// Deleting a record requires some additional processing. Gorm
	// uses soft deletion by default (see https://gorm.io/docs/delete.html#Soft-Delete).
	rowsAffected, err := gorm.G[models.Book](s.db).Where("id = ?", id).Delete(ctx)

	if err != nil {
		return err
	}

    // No affected rows ⇒ no record existed; should return an error  	
	if rowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

// Other methods (PATCH, UPDATE, etc.)

