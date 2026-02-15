package services

import (
	"github.com/Jcorrieri/uf-marketplace/backend/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserService handles user-related database operations
type UserService struct {
	db *gorm.DB
}

// Constructor
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{
		db: db,
	}
}

func (s *UserService) GetByID(id uuid.UUID) (*models.User, error) {
	var user models.User

	if err := s.db.First(&user, "id = ?", id).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *UserService) UpdateSettings(
	id uuid.UUID,
	username string,
	firstName string,
	lastName string,
) (*models.User, error) {

	var user models.User

	if err := s.db.First(&user, "id = ?", id).Error; err != nil {
		return nil, err
	}

	user.Username = username
	user.FirstName = firstName
	user.LastName = lastName

	if err := s.db.Save(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}
