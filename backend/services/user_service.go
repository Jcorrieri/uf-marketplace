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
