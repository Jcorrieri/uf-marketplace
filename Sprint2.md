# Sprint 2 Technical Document

## Team
- Shakir Gamzaev (Frontend)
- Pranav Padmapada Kodihalli (Frontend/Backend)
- Jacomo Corrieri (Frontend/Backend)
- Venkata Nitchaya Reddy Konkala (Backend)

## Sprint Goals
- Integrate frontend and backend
- Complete remaining Sprint 1 issues
- Add frontend and backend testing
- Document backend API

## Summary of Work Completed
- Frontend and backend integration status: In progress (frontend uses /api proxy; backend running separately).
- Remaining Sprint 1 issues addressed: Login flow testing; navbar profile initials; main page top bar fix; search/filter merge.
- Notable improvements or fixes: Added backend auth, middleware, and JWT utility tests; DB name now configurable via env; UI updates to navbar/profile initials.

## Changes Since Sprint 1
- Backend: Added tests for auth service, JWT utils, middleware, and user response model.
- Backend: Switched DB filename to environment variable (no longer hardcoded).
- Frontend: Updated navbar profile button to show user initials; fixed top bar layout.
- Frontend: Merged search/filter feature work.

## Frontend Work
### Cypress E2E Tests
- Framework: Cypress 15.12.0 (Electron 138, headless).
- Summary: End-to-end tests covering the Login and Sign-Up pages — form display, validation, disabled-state logic, API mocking, and navigation.
- Tests (22 total: 16 login, 6 sign-up):
  - Login page
    - [frontend/cypress/e2e/login.cy.ts](frontend/cypress/e2e/login.cy.ts)
    - Tests:
      - should display the login form with all expected elements
        - Details: Visits `/login`, asserts "Welcome Back" heading, email/password inputs, Sign In button, forgot-password text, and sign-up link exist.
      - should display the hero section on the right
        - Details: Asserts marketing copy ("Buy & Sell on", "Verified UF Students Only", "Secure Transactions", "Campus Meetups") is visible.
      - should keep Sign In button disabled when both fields are empty
        - Details: Asserts button is disabled with no input.
      - should keep Sign In button disabled when only email is filled
        - Details: Types a valid email; button remains disabled without a password.
      - should keep Sign In button disabled when only password is filled
        - Details: Types a password; button remains disabled without an email.
      - should keep Sign In button disabled for an invalid email format
        - Details: Types `not-an-email` for email and a password; button stays disabled.
      - should keep Sign In button disabled for email missing domain
        - Details: Types `user@` for email and a password; button stays disabled.
      - should show "Email is required" error when email is touched and left empty
        - Details: Focuses then blurs email input; expects "Email is required" message.
      - should show "Enter a valid email" error for a malformed email
        - Details: Types `bad-email` and blurs; expects "Enter a valid email" message.
      - should enable Sign In button with valid email and password
        - Details: Types `user@ufl.edu` and a password; button becomes enabled.
      - should enable Sign In button with any valid email (not just @ufl.edu)
        - Details: Types `user@gmail.com` and a password; button becomes enabled.
      - should toggle password visibility when the eye icon is clicked
        - Details: Verifies input type flips between "password" and "text" on toggle clicks.
      - should redirect to /main on successful login
        - Details: Intercepts `POST /api/auth/login` (200) and `GET /api/users/me` (200); fills form, clicks Sign In, asserts URL includes `/main`.
      - should show an alert when login fails with invalid credentials
        - Details: Intercepts `POST /api/auth/login` (401); expects `window.alert` with "Invalid email or password".
      - should show an alert when the server returns a 500 error
        - Details: Intercepts `POST /api/auth/login` (500); expects `window.alert` with "Invalid email or password".
      - should navigate to the sign-up page when "Sign up" link is clicked
        - Details: Clicks the sign-up link; asserts URL includes `/sign-up`.
    - Code:
      ```ts
      describe('Login Page', () => {
        function matType(selector: string, value: string) {
          cy.get(selector).type(value, { force: true });
        }

        beforeEach(() => {
          cy.visit('/login');
        });

        it('should display the login form with all expected elements', () => {
          cy.contains('Welcome Back').should('be.visible');
          cy.get('input#email').should('exist');
          cy.get('input#password').should('exist');
          cy.get('button.login-btn').should('exist').and('contain.text', 'Sign In');
          cy.contains('Forgot password?').should('be.visible');
          cy.contains("Don't have an account?").should('be.visible');
          cy.get('a.signup-link').should('have.attr', 'href', '/sign-up');
        });

        it('should display the hero section on the right', () => {
          cy.contains('Buy & Sell on').should('be.visible');
          cy.contains('Verified UF Students Only').should('be.visible');
          cy.contains('Secure Transactions').should('be.visible');
          cy.contains('Campus Meetups').should('be.visible');
        });

        it('should keep Sign In button disabled when both fields are empty', () => {
          cy.get('button.login-btn').should('be.disabled');
        });

        it('should keep Sign In button disabled when only email is filled', () => {
          matType('input#email', 'user@ufl.edu');
          cy.get('button.login-btn').should('be.disabled');
        });

        it('should keep Sign In button disabled when only password is filled', () => {
          matType('input#password', 'password123');
          cy.get('button.login-btn').should('be.disabled');
        });

        it('should keep Sign In button disabled for an invalid email format', () => {
          matType('input#email', 'not-an-email');
          matType('input#password', 'password123');
          cy.get('button.login-btn').should('be.disabled');
        });

        it('should keep Sign In button disabled for email missing domain', () => {
          matType('input#email', 'user@');
          matType('input#password', 'password123');
          cy.get('button.login-btn').should('be.disabled');
        });

        it('should show "Email is required" error when email is touched and left empty', () => {
          cy.get('input#email').focus().blur();
          cy.contains('Email is required').should('be.visible');
        });

        it('should show "Enter a valid email" error for a malformed email', () => {
          matType('input#email', 'bad-email');
          cy.get('input#email').blur();
          cy.contains('Enter a valid email').should('be.visible');
        });

        it('should enable Sign In button with valid email and password', () => {
          matType('input#email', 'user@ufl.edu');
          matType('input#password', 'password123');
          cy.get('button.login-btn').should('not.be.disabled');
        });

        it('should enable Sign In button with any valid email (not just @ufl.edu)', () => {
          matType('input#email', 'user@gmail.com');
          matType('input#password', 'somepassword');
          cy.get('button.login-btn').should('not.be.disabled');
        });

        it('should toggle password visibility when the eye icon is clicked', () => {
          matType('input#password', 'secret123');
          cy.get('input#password').should('have.attr', 'type', 'password');
          cy.get('input#password')
            .parents('mat-form-field')
            .find('button[matIconButton], button[matsuffix], button[matSuffix]')
            .click({ force: true });
          cy.get('input#password').should('have.attr', 'type', 'text');
          cy.get('input#password')
            .parents('mat-form-field')
            .find('button[matIconButton], button[matsuffix], button[matSuffix]')
            .click({ force: true });
          cy.get('input#password').should('have.attr', 'type', 'password');
        });

        it('should redirect to /main on successful login', () => {
          cy.intercept('POST', '/api/auth/login', {
            statusCode: 200,
            body: { id: 'abc-123', first_name: 'Test', last_name: 'User', email: 'testuser@ufl.edu' },
          }).as('loginRequest');
          cy.intercept('GET', '/api/users/me', {
            statusCode: 200,
            body: { id: 'abc-123', first_name: 'Test', last_name: 'User', email: 'testuser@ufl.edu' },
          }).as('meRequest');
          matType('input#email', 'testuser@ufl.edu');
          matType('input#password', 'ValidPass123');
          cy.get('button.login-btn').should('not.be.disabled');
          cy.get('button.login-btn').click();
          cy.wait('@loginRequest');
          cy.url().should('include', '/main');
        });

        it('should show an alert when login fails with invalid credentials', () => {
          cy.intercept('POST', '/api/auth/login', {
            statusCode: 401,
            body: { error: 'invalid credentials' },
          }).as('loginFail');
          matType('input#email', 'testuser@ufl.edu');
          matType('input#password', 'wrongpassword');
          cy.get('button.login-btn').click();
          cy.on('window:alert', (alertText) => {
            expect(alertText).to.equal('Invalid email or password');
          });
          cy.wait('@loginFail');
        });

        it('should show an alert when the server returns a 500 error', () => {
          cy.intercept('POST', '/api/auth/login', {
            statusCode: 500,
            body: { error: 'internal server error' },
          }).as('loginServerError');
          matType('input#email', 'testuser@ufl.edu');
          matType('input#password', 'password123');
          cy.get('button.login-btn').click();
          cy.on('window:alert', (alertText) => {
            expect(alertText).to.equal('Invalid email or password');
          });
          cy.wait('@loginServerError');
        });

        it('should navigate to the sign-up page when "Sign up" link is clicked', () => {
          cy.get('a.signup-link').click();
          cy.url().should('include', '/sign-up');
        });
      });
      ```
    - Result: PASS (16 passing, 0 failing — 7s)
  - Sign-up page
    - [frontend/cypress/e2e/sign-up.cy.ts](frontend/cypress/e2e/sign-up.cy.ts)
    - Tests:
      - should display the sign-up form
        - Details: Visits `/sign-up`, asserts "Create Account" heading and all five form inputs (firstName, lastName, email, password, confirmPassword) exist.
      - should keep Sign Up button disabled when password is too short
        - Details: Fills all fields with a short password (`short`); button stays disabled.
      - should show minlength error when password is too short
        - Details: Types `short` into password and blurs; expects "Password must be at least 8 characters".
      - should keep Sign Up button disabled when passwords do not match
        - Details: Fills valid inputs but mismatched passwords; button stays disabled.
      - should show error when registering with an already taken email
        - Details: Intercepts `POST /api/auth/register` (500); fills form, clicks Sign Up, expects "could not create user" message.
      - should enable Sign Up button with valid inputs
        - Details: Fills all fields with valid data; button becomes enabled.
    - Code:
      ```ts
      describe('Sign Up Page', () => {
        function matType(formControlName: string, value: string) {
          cy.get(`input[formControlName="${formControlName}"]`).type(value, { force: true });
        }

        beforeEach(() => {
          cy.visit('/sign-up');
        });

        it('should display the sign-up form', () => {
          cy.contains('Create Account').should('be.visible');
          cy.get('input[formControlName="firstName"]').should('exist');
          cy.get('input[formControlName="lastName"]').should('exist');
          cy.get('input[formControlName="email"]').should('exist');
          cy.get('input[formControlName="password"]').should('exist');
          cy.get('input[formControlName="confirmPassword"]').should('exist');
        });

        it('should keep Sign Up button disabled when password is too short', () => {
          matType('firstName', 'Test');
          matType('lastName', 'User');
          matType('email', 'testuser@ufl.edu');
          matType('password', 'short');
          matType('confirmPassword', 'short');
          cy.get('button.signup-btn').should('be.disabled');
        });

        it('should show minlength error when password is too short', () => {
          cy.get('input[formControlName="password"]').type('short', { force: true });
          cy.get('input[formControlName="password"]').blur();
          cy.contains('Password must be at least 8 characters').should('be.visible');
        });

        it('should keep Sign Up button disabled when passwords do not match', () => {
          matType('firstName', 'Test');
          matType('lastName', 'User');
          matType('email', 'testuser@ufl.edu');
          matType('password', 'ValidPass123');
          matType('confirmPassword', 'Different123');
          cy.get('button.signup-btn').should('be.disabled');
        });

        it('should show error when registering with an already taken email', () => {
          cy.intercept('POST', '/api/auth/register', {
            statusCode: 500,
            body: { error: 'could not create user' },
          }).as('registerRequest');
          matType('firstName', 'Test');
          matType('lastName', 'User');
          matType('email', 'user1@ufl.edu');
          matType('password', 'password123');
          matType('confirmPassword', 'password123');
          cy.get('button.signup-btn').should('not.be.disabled');
          cy.get('button.signup-btn').click();
          cy.wait('@registerRequest');
          cy.contains('could not create user').should('be.visible');
        });

        it('should enable Sign Up button with valid inputs', () => {
          matType('firstName', 'Test');
          matType('lastName', 'User');
          matType('email', 'newuser@ufl.edu');
          matType('password', 'StrongPass1');
          matType('confirmPassword', 'StrongPass1');
          cy.get('button.signup-btn').should('not.be.disabled');
        });
      });
      ```
    - Result: PASS (6 passing, 0 failing — 5s)

## Backend Work
### API Documentation
- See the API section below for endpoint details.

### Unit Tests
- Framework: Go testing package with Gin, Gorm, and bcrypt.
- Summary: Table-driven auth/middleware/JWT tests plus model response validation.
- Tests (1:1 to function ratio target):
  - JWT utility validation
    - [backend/utils/jwt_test.go](backend/utils/jwt_test.go)
    - Tests:
      - Valid Token
        - Details: Signs HS256 token with matching secret; expects no error.
      - Expired Token
        - Details: Uses `ExpiresAt` in the past; expects `jwt.ErrTokenExpired`.
      - Invalid Signing Method
        - Details: Uses ES256 signing method; expects token parsing failure (`jwt.ErrTokenMalformed`).
    - Code:
      ```go
      package utils_test

      import (
        "errors"
        "testing"
        "time"

        "github.com/Jcorrieri/uf-marketplace/backend/utils"
        "github.com/golang-jwt/jwt/v5"
      )

      func TestTokenValidation_TableDriven(t *testing.T) {
        type testCase struct {
          name           string
          providedSecret string
          token          func() string
          expectedError  error
        }

        tests := []testCase{
          {
            name: "Valid Token",
            providedSecret: "correct_secret",
            token: func() string {
              claims := jwt.RegisteredClaims{Subject: "user123"}
              token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
              s, _ := token.SignedString([]byte("correct_secret"))
              return s
            },
            expectedError: nil,
          },
          {
            name: "Expired Token",
            providedSecret: "correct_secret",
            token: func() string {
              claims := jwt.RegisteredClaims{ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour))}
              token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
              s, _ := token.SignedString([]byte("correct_secret"))
              return s
            },
            expectedError: jwt.ErrTokenExpired,
          },
          {
            name: "Invalid Signing Method",
            providedSecret: "correct_secret",
            token: func() string {
              claims := jwt.RegisteredClaims{Subject: "user123"}
              token := jwt.NewWithClaims(jwt.SigningMethodES256, claims)
              s, _ := token.SignedString([]byte("correct_secret"))
              return s
            },
            expectedError: jwt.ErrTokenMalformed,
          },
        }

        for _, tc := range tests {
          t.Run(tc.name, func(t *testing.T) {
            _, err := utils.ValidateToken(tc.token(), tc.providedSecret)

            if !errors.Is(err, tc.expectedError) {
              t.Errorf("Expected %v, got %v", tc.expectedError, err)
            }
          })
        }
      }
      ```
    - Result: PASS (all cases)
  - Auth service validation
    - [backend/services/auth_service_test.go](backend/services/auth_service_test.go)
    - Tests:
      - Bad password rejected
        - Details: Uses correct email with wrong password; expects `bcrypt.ErrMismatchedHashAndPassword`.
      - Unknown email rejected
        - Details: Uses unknown email; expects `gorm.ErrRecordNotFound`.
    - Code:
      ```go
      package services_test

      import (
        "context"
        "errors"
        "os"
        "testing"

        "github.com/Jcorrieri/uf-marketplace/backend/models"
        "github.com/Jcorrieri/uf-marketplace/backend/services"
        "golang.org/x/crypto/bcrypt"
        "gorm.io/driver/sqlite"
        "gorm.io/gorm"
      )

      var (
        dbFile = "mock.db"
        db     *gorm.DB
        testUser models.User
      )

      func setupDB() {
        ctx := context.Background()
        var err error

        db, err = gorm.Open(sqlite.Open(dbFile), &gorm.Config{})
        if err != nil {
          panic("failed to connect database")
        }

        err = db.AutoMigrate(
          &models.User{},
        )
        if err != nil {
          panic("Failed to automigrate")
        }

        password, err := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)
        if err != nil {
          panic("Failed to generate password")
        }

        testUser = models.User{
          Email: "mock@ufl.edu",
          PasswordHash: string(password),
          FirstName: "John",
          LastName: "Doe",
        }

        if err := gorm.G[models.User](db).Create(ctx, &testUser); err != nil {
          panic("Failed to create user.")
        }
      }

      func teardown() {
        sqlDB, _ := db.DB()
        if sqlDB != nil {
          sqlDB.Close()
        }

        err := os.Remove(dbFile)
        if err != nil && !errors.Is(err, os.ErrNotExist) {
          panic("Failed to clean up sqlite file")
        }
      }

      func TestMain(m *testing.M) {
        exitCode := func() int {
          setupDB()
          defer teardown()
          return m.Run()
        }()

        os.Exit(exitCode)
      }

      func TestAuthBadPassword(t *testing.T) {
        ctx := context.Background()
        authService := services.NewAuthService(db)
        _, _, err := authService.Authenticate(ctx, testUser.Email, "bad_password")

        if !errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
          t.Errorf("Expected %v, got %v", bcrypt.ErrMismatchedHashAndPassword, err)
        }
      }

      func TestAuthBadEmail(t *testing.T) {
        ctx := context.Background()
        authService := services.NewAuthService(db)
        _, _, err := authService.Authenticate(ctx, "bad@ufl.edu", testUser.PasswordHash)

        if !errors.Is(err, gorm.ErrRecordNotFound) {
          t.Errorf("Expected %v, got %v", gorm.ErrRecordNotFound, err)
        }
      }
      ```
    - Result: PASS (all cases)
  - Auth middleware behavior
    - [backend/middleware/middleware_test.go](backend/middleware/middleware_test.go)
    - Tests:
      - Missing cookie
        - Details: Sends no `session_token` cookie; expects 401 with `{"error":"Forbidden"}`.
      - Expired token
        - Details: Sends expired JWT cookie; expects 401 with `{"error":"Session invalid or expired"}`.
      - Invalid secret
        - Details: Signs JWT with wrong secret; expects 401 with `{"error":"Session invalid or expired"}`.
      - Valid token
        - Details: Sends valid JWT cookie; expects 200 with empty body.
    - Code:
      ```go
      package middleware_test

      import (
        "net/http"
        "net/http/httptest"
        "testing"
        "time"

        "github.com/Jcorrieri/uf-marketplace/backend/middleware"
        "github.com/gin-gonic/gin"
        "github.com/golang-jwt/jwt/v5"
      )

      func TestMiddleware_TableDriven(t *testing.T) {
        type testCase struct {
          name           string
          cookieName     string
          cookieValue    string
          providedSecret string
          expectedStatus int
          expectedBody   string
        }

        tests := []testCase{
          {
            name: "Missing Cookie",
            cookieName: "wrong_name",
            cookieValue: func() string { return "any" }(),
            providedSecret: "correct_secret",
            expectedStatus: 401,
            expectedBody: `{"error":"Forbidden"}`,
          },
          {
            name: "Expired Token",
            cookieName: "session_token",
            cookieValue: func() string {
              claims := jwt.RegisteredClaims{ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour))}
              token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
              s, _ := token.SignedString([]byte("correct_secret"))
              return s
            }(),
            providedSecret: "correct_secret",
            expectedStatus: 401,
            expectedBody:   `{"error":"Session invalid or expired"}`,
          },
          {
            name: "Invalid Secret",
            cookieName: "session_token",
            cookieValue: func() string {
              claims := jwt.RegisteredClaims{Subject: "user123"}
              token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
              s, _ := token.SignedString([]byte("WRONG-SECRET"))
              return s
            }(),
            providedSecret: "correct-secret",
            expectedStatus: 401,
            expectedBody:   `{"error":"Session invalid or expired"}`,
          },
          {
            name: "Valid Token",
            cookieName: "session_token",
            cookieValue: func() string {
              claims := jwt.RegisteredClaims{Subject: "user123"}
              token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
              s, _ := token.SignedString([]byte("correct_secret"))
              return s
            }(),
            providedSecret: "correct_secret",
            expectedStatus: 200,
            expectedBody: ``,
          },
        }

        for _, tc := range tests {
          t.Run(tc.name, func(t *testing.T) {
            gin.SetMode(gin.TestMode)
            w := httptest.NewRecorder()
            r := gin.New()

            r.Use(middleware.AuthMiddleware(tc.providedSecret, "session_token"))
            r.GET("/test", func(c *gin.Context) {
              c.Status(200)
            })

            req, _ := http.NewRequest("GET", "/test", nil)
            req.AddCookie(&http.Cookie{
              Name:  tc.cookieName,
              Value: tc.cookieValue,
            })

            r.ServeHTTP(w, req)

            if w.Code != tc.expectedStatus {
              t.Errorf("expected status %d, got %d", tc.expectedStatus, w.Code)
            }
            if w.Body.String() != tc.expectedBody {
              t.Errorf("expected body %s, got %s", tc.expectedBody, w.Body.String())
            }
          })
        }
      }
      ```
    - Result: PASS (all cases)
  - User response mapping
    - [backend/models/user_test.go](backend/models/user_test.go)
    - Tests:
      - GetResponse maps fields correctly
        - Details: Builds a mock `User` and verifies the response mirrors ID, email, names, and created timestamp.
    - Code:
      ```go
      package models_test

      import (
        "testing"
        "time"

        "github.com/Jcorrieri/uf-marketplace/backend/models"
        "github.com/google/uuid"
        "gorm.io/gorm"
      )

      func TestUserResponse(t *testing.T) {
        id, err := uuid.NewV7()
        if err != nil {
          t.Error("Failed to create user ID")
        }

        user := models.User{
          ID: id,
          Email: "test@ufl.edu",
          PasswordHash: "password",
          FirstName: "John",
          LastName: "Doe",
          CreatedAt: time.Now(),
          UpdatedAt: time.Now(),
          DeletedAt: gorm.DeletedAt{},
        }

        response := user.GetResponse()

        if response.ID != user.ID {
          t.Errorf("ID mismatch: got %v, want %v", response.ID, user.ID)
        }
        if response.Email != user.Email {
          t.Errorf("Email mismatch: got %v, want %v", response.Email, user.Email)
        }
        if response.FirstName != user.FirstName {
          t.Errorf("First name mismatch: got %v, want %v", response.FirstName, user.FirstName)
        }
        if response.LastName != user.LastName {
          t.Errorf("Last name mismatch: got %v, want %v", response.LastName, user.LastName)
        }
        if !response.CreatedAt.Equal(user.CreatedAt) {
          t.Errorf("CreatedAt mismatch: got %v, want %v", response.CreatedAt, user.CreatedAt)
        }
      }
      ```
    - Result: PASS

## Backend API Documentation
Base path: `/api`

Authentication endpoints are public. User and settings endpoints require a valid JWT in the `session_token` cookie.

### Authentication
- POST /auth/register
  - Purpose: Register a new user (UF email only).
  - Request body:
    ```json
    {
      "email": "student@ufl.edu",
      "password": "string (min 6)",
      "first_name": "string",
      "last_name": "string"
    }
    ```
  - Response: `201 Created`
    ```json
    {
      "id": "uuid",
      "email": "student@ufl.edu",
      "first_name": "string",
      "last_name": "string",
      "created_at": "timestamp"
    }
    ```
  - Errors:
    - `400` invalid input or non-@ufl.edu email
    - `500` could not create user
- POST /auth/login
  - Purpose: Login with email and password; sets HttpOnly session cookie.
  - Request body:
    ```json
    {
      "email": "student@ufl.edu",
      "password": "string"
    }
    ```
  - Response: `200 OK`
    ```json
    {
      "id": "uuid",
      "email": "student@ufl.edu",
      "first_name": "string",
      "last_name": "string",
      "created_at": "timestamp"
    }
    ```
  - Errors:
    - `400` invalid input
    - `401` invalid credentials
- POST /auth/logout
  - Purpose: Logout and clear session cookie.
  - Response: `200 OK`
    ```json
    {"message": "logout successful"}
    ```
  - Errors:
    - `500` could not logout

### Users
- GET /users/me
  - Purpose: Get current authenticated user.
  - Response: `200 OK` (UserResponse)
- GET /users/:id
  - Purpose: Get user by ID.
  - Response: `200 OK` (UserResponse)
  - Errors:
    - `400` invalid ID
    - `404` user not found
- DELETE /users/me
  - Purpose: Delete current authenticated user.
  - Response: `204 No Content`
  - Errors:
    - `400` invalid ID
    - `500` error deleting user

### Settings
- GET /settings
  - Purpose: Get current user settings (currently returns user profile info).
  - Response: `200 OK` (UserResponse)
  - Notes: Uses a temporary hardcoded user ID in the handler.
- PUT /settings
  - Purpose: Update profile settings (first/last name only).
  - Request body:
    ```json
    {
      "first_name": "string",
      "last_name": "string"
    }
    ```
  - Response: `200 OK` (UserResponse)
  - Errors:
    - `400` first_name and last_name required
    - `404` user not found

## Test Results
- Frontend Cypress tests: PASS (22 tests total — 16 login + 6 sign-up, 0 failed).
- Backend unit tests: PASS (12 tests, 0 failed).
