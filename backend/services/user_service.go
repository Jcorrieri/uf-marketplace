package services

import (
	"context"

	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"gorm.io/gorm"
)

// Define the service struct whose only dependency is the db connection.
// Services will handle all database operations for each model (users, posts, etc.).
// See https://gorm.io/docs/the_generics_way.html for generics API usage.

// UserService handles user-related database operations
type UserService struct {
	db *gorm.DB
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) GetAll(ctx context.Context) ([]models.User, error) {
	// Use gorm.G[model.<model>]()... to get built-in type safety
	return gorm.G[models.User](s.db).Find(ctx)
}

func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (models.User, error) {
	return gorm.G[models.User](s.db).Where("id = ?", id).First(ctx)
}

// GetByEmail returns a user by email
func (s *UserService) GetByEmail(ctx context.Context, email string) (models.User, error) {
	return gorm.G[models.User](s.db).Where("email = ?", email).First(ctx)
}

// CheckPassword compares the given password with the user's password hash
func (s *UserService) CheckPassword(user models.User, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
}

type CreateUserRequest struct {
	Username  string
	Email     string
	FirstName string
	LastName  string
	Password  string
}

func (s *UserService) Create(ctx context.Context, request CreateUserRequest) (*models.User, error) {
	// TODO: Make utility fn ?
	hash, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := models.User{
		Username:     request.Username,
		Email:        request.Email,
		PasswordHash: string(hash),
		FirstName:    request.FirstName,
		LastName:     request.LastName,
	}

	// Throws error if user already exists
	if err := gorm.G[models.User](s.db).Create(ctx, &user); err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *UserService) Delete(ctx context.Context, id uuid.UUID) error {
	// Deleting a record requires some additional processing. Gorm
	// uses soft deletion by default (see https://gorm.io/docs/delete.html#Soft-Delete).
	rowsAffected, err := gorm.G[models.User](s.db).Where("id = ?", id).Delete(ctx)

	if err != nil {
		return err
	}

	// No affected rows ⇒ no record existed; should return an error
	if rowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

type UpdateUserRequest struct {
	Username  string
	FirstName string
	LastName  string
}

func (s *UserService) UpdateSettings(
	id uuid.UUID,
	req UpdateUserRequest,
) (*models.User, error) {

	var user models.User

	if err := s.db.First(&user, "id = ?", id).Error; err != nil {
		return nil, err
	}

	user.Username = req.Username

	user.FirstName = req.FirstName
	user.LastName = req.LastName

	if err := s.db.Save(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}
