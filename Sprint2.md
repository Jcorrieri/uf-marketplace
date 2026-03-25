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
### Cypress Test
- Status: Not found in repo yet.
- Planned: Add a simple UI interaction test (e.g., open login page and type into email/password fields).

### Unit Tests
- Framework: Angular TestBed (default Angular CLI testing).
- Summary: Basic component creation and smoke checks for app, navbar, login, and signup views.
- Tests (1:1 to function ratio target):
  - App component
    - [frontend/src/app/app.spec.ts](frontend/src/app/app.spec.ts)
    - Tests:
      - should create the app
        - Details: Instantiates `App` via `TestBed` and asserts the component instance is truthy.
      - should render title
        - Details: Waits for component stability, queries `h1`, and checks title text contains `Hello, UfMarketPlace`.
    - Code:
      ```ts
      it('should create the app', () => {
        const fixture = TestBed.createComponent(App);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
      });

      it('should render title', async () => {
        const fixture = TestBed.createComponent(App);
        await fixture.whenStable();
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('h1')?.textContent)
          .toContain('Hello, UfMarketPlace');
      });
      ```
  - Navbar component
    - [frontend/src/app/components/navbar/navbar.spec.ts](frontend/src/app/components/navbar/navbar.spec.ts)
    - Tests:
      - should create
        - Details: Creates `Navbar` component and asserts the instance exists after change detection.
    - Code:
      ```ts
      it('should create', () => {
        expect(component).toBeTruthy();
      });
      ```
  - Login page component
    - [frontend/src/app/views/login-page/login-page.spec.ts](frontend/src/app/views/login-page/login-page.spec.ts)
    - Tests:
      - should create
        - Details: Builds the `LoginPage` component and verifies it instantiates without errors.
    - Code:
      ```ts
      it('should create', () => {
        expect(component).toBeTruthy();
      });
      ```
  - Sign-up page component
    - [frontend/src/app/views/sign-up-page/sign-up-page.spec.ts](frontend/src/app/views/sign-up-page/sign-up-page.spec.ts)
    - Tests:
      - should create
        - Details: Builds the `SignUpPage` component and checks that the instance is created.
    - Code:
      ```ts
      it('should create', () => {
        expect(component).toBeTruthy();
      });
      ```

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
- Frontend unit tests: Not run in this session.
- Frontend Cypress test: Not run in this session (no spec found).
- Backend unit tests: PASS (12 tests, 0 failed).

## Notes / Risks
- TODO

## Submission Links
- GitHub link: TODO
- Video link(s): TODO

## Presentation Outline
- Member 1: TODO
- Member 2: TODO
- Member 3: TODO
