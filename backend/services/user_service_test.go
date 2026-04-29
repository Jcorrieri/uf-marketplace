package services_test

import (
	"context"
	"testing"

	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// --- Helpers ---

func newUserService() *services.UserService {
	return services.NewUserService(db)
}

func ctx() context.Context {
	return context.Background()
}

// --- GetAll ---

func TestGetAll_ReturnsUsers(t *testing.T) {
	svc := newUserService()

	users, err := svc.GetAll(ctx())
	if err != nil {
		t.Fatalf("GetAll returned unexpected error: %v", err)
	}
	if len(users) == 0 {
		t.Fatal("GetAll returned no users; expected at least the seeded test user")
	}
}

// --- GetByID ---

func TestGetByID_ExistingUser(t *testing.T) {
	svc := newUserService()

	user, err := svc.GetByID(ctx(), testUser.ID)
	if err != nil {
		t.Fatalf("GetByID returned unexpected error: %v", err)
	}
	if user.ID != testUser.ID {
		t.Errorf("expected ID %v, got %v", testUser.ID, user.ID)
	}
	if user.Email != testUser.Email {
		t.Errorf("expected email %q, got %q", testUser.Email, user.Email)
	}
}

func TestGetByID_NotFound(t *testing.T) {
	svc := newUserService()

	_, err := svc.GetByID(ctx(), uuid.New())
	if err == nil {
		t.Fatal("expected error for unknown ID, got nil")
	}
}

// --- GetByEmail ---

func TestGetByEmail_ExistingUser(t *testing.T) {
	svc := newUserService()

	user, err := svc.GetByEmail(ctx(), testUser.Email)
	if err != nil {
		t.Fatalf("GetByEmail returned unexpected error: %v", err)
	}
	if user.Email != testUser.Email {
		t.Errorf("expected email %q, got %q", testUser.Email, user.Email)
	}
}

func TestGetByEmail_NotFound(t *testing.T) {
	svc := newUserService()

	_, err := svc.GetByEmail(ctx(), "nobody@ufl.edu")
	if err == nil {
		t.Fatal("expected error for unknown email, got nil")
	}
}

// --- Create ---

func TestCreate_Success(t *testing.T) {
	svc := newUserService()

	req := services.CreateUserRequest{
		Email:     "newuser@ufl.edu",
		FirstName: "Jane",
		LastName:  "Smith",
		Password:  "securepassword",
	}

	user, err := svc.Create(ctx(), req)
	if err != nil {
		t.Fatalf("Create returned unexpected error: %v", err)
	}
	if user == nil {
		t.Fatal("Create returned nil user")
	}
	if user.Email != req.Email {
		t.Errorf("expected email %q, got %q", req.Email, user.Email)
	}
	if user.FirstName != req.FirstName {
		t.Errorf("expected first name %q, got %q", req.FirstName, user.FirstName)
	}
	if user.ID == uuid.Nil {
		t.Error("expected a non-nil UUID to be assigned")
	}

	// Password must be stored as a hash, never plaintext
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		t.Errorf("password hash does not match original password: %v", err)
	}

	// Cleanup
	_ = svc.Delete(ctx(), user.ID)
}

func TestCreate_DuplicateEmail(t *testing.T) {
	svc := newUserService()

	req := services.CreateUserRequest{
		Email:     testUser.Email, // already seeded
		FirstName: "Dup",
		LastName:  "User",
		Password:  "password",
	}

	_, err := svc.Create(ctx(), req)
	if err == nil {
		t.Fatal("expected error when creating duplicate email, got nil")
	}
}

// --- Delete ---

func TestDelete_ExistingUser(t *testing.T) {
	svc := newUserService()

	// Create a throwaway user to delete
	req := services.CreateUserRequest{
		Email:     "todelete@ufl.edu",
		FirstName: "Delete",
		LastName:  "Me",
		Password:  "password",
	}
	user, err := svc.Create(ctx(), req)
	if err != nil {
		t.Fatalf("setup: Create failed: %v", err)
	}

	if err := svc.Delete(ctx(), user.ID); err != nil {
		t.Fatalf("Delete returned unexpected error: %v", err)
	}

	// Confirm the record is gone
	_, err = svc.GetByID(ctx(), user.ID)
	if err == nil {
		t.Fatal("expected error after deletion, got nil")
	}
}

func TestDelete_NotFound(t *testing.T) {
	svc := newUserService()

	err := svc.Delete(ctx(), uuid.New())
	if err == nil {
		t.Fatal("expected error when deleting non-existent user, got nil")
	}
	if err != gorm.ErrRecordNotFound {
		t.Errorf("expected gorm.ErrRecordNotFound, got %v", err)
	}
}

// --- Update ---

func TestUpdate_Success(t *testing.T) {
	svc := newUserService()

	// Create a user to update so the shared testUser is unmodified
	req := services.CreateUserRequest{
		Email:     "toupdate@ufl.edu",
		FirstName: "Old",
		LastName:  "Name",
		Password:  "password",
	}
	user, err := svc.Create(ctx(), req)
	if err != nil {
		t.Fatalf("setup: Create failed: %v", err)
	}
	defer svc.Delete(ctx(), user.ID)

	updateReq := services.UpdateUserRequest{
		FirstName: "New",
		LastName:  "Name",
	}

	updated, err := svc.Update(ctx(), user.ID, updateReq)
	if err != nil {
		t.Fatalf("Update returned unexpected error: %v", err)
	}
	if updated.FirstName != updateReq.FirstName {
		t.Errorf("expected first name %q, got %q", updateReq.FirstName, updated.FirstName)
	}
	if updated.LastName != updateReq.LastName {
		t.Errorf("expected last name %q, got %q", updateReq.LastName, updated.LastName)
	}
}

func TestUpdate_NotFound(t *testing.T) {
	svc := newUserService()

	_, err := svc.Update(ctx(), uuid.New(), services.UpdateUserRequest{
		FirstName: "Ghost",
		LastName:  "User",
	})
	if err == nil {
		t.Fatal("expected error when updating non-existent user, got nil")
	}
	if err != gorm.ErrRecordNotFound {
		t.Errorf("expected gorm.ErrRecordNotFound, got %v", err)
	}
}

// --- UpdateProfileImage ---

func TestUpdateProfileImage_Create(t *testing.T) {
	svc := newUserService()

	imageData := []byte{0xFF, 0xD8, 0xFF} // minimal JPEG header bytes
	imageID, err := svc.UpdateProfileImage(ctx(), testUser.ID, imageData, "image/jpeg")
	if err != nil {
		t.Fatalf("UpdateProfileImage (create) returned unexpected error: %v", err)
	}
	if imageID == uuid.Nil {
		t.Error("expected a valid image UUID, got Nil")
	}
}

func TestUpdateProfileImage_Update(t *testing.T) {
	svc := newUserService()

	// First call creates the image
	first, err := svc.UpdateProfileImage(ctx(), testUser.ID, []byte{0x01}, "image/png")
	if err != nil {
		t.Fatalf("UpdateProfileImage first call failed: %v", err)
	}

	// Second call should update, returning the same image ID
	second, err := svc.UpdateProfileImage(ctx(), testUser.ID, []byte{0x02}, "image/png")
	if err != nil {
		t.Fatalf("UpdateProfileImage second call failed: %v", err)
	}
	if first != second {
		t.Errorf("expected same image ID on update: first=%v second=%v", first, second)
	}
}
