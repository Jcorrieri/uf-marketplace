package main

import (
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/Jcorrieri/uf-marketplace/backend/database"
	"github.com/Jcorrieri/uf-marketplace/backend/handlers"
	"github.com/Jcorrieri/uf-marketplace/backend/middleware"
	"github.com/Jcorrieri/uf-marketplace/backend/services"
)

func RegisterAuthRoutes(
	public *gin.RouterGroup,
	authHandler *handlers.AuthHandler,
	authService *services.AuthService,
) {
	public.POST("/register", authHandler.Register)
	public.POST("/login", authHandler.Login)
	public.POST("/logout", authHandler.Logout)
}

func RegisterUserRoutes(
	protected *gin.RouterGroup,
	userHandler *handlers.UserHandler,
	userService *services.UserService,
) {
	protected.GET("/users/:id", userHandler.GetUserById)
	protected.GET("/users/me", userHandler.GetCurrentUser)
	protected.DELETE("/users/me", userHandler.DeleteUser)
	protected.PUT("/users/me", userHandler.UpdateSettings)
}

func RegisterListingsRoutes(
	public *gin.RouterGroup,
	protected *gin.RouterGroup,
	listingHandler *handlers.ListingHandler,
	listingService *services.ListingService,
) {
	public.GET("/listings", listingHandler.GetListings)
	protected.POST("/listings", listingHandler.CreateListing)
}

func main() {
	// Setup
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Error loading .env file")
	}

	db := database.Connect(os.Getenv("DB_NAME"))

	sessionName := os.Getenv("SESSION_COOKIE_NAME")
	if sessionName == "" {
		sessionName = "session_token"
	}

	// Services
	authService := services.NewAuthService(db)
	userService := services.NewUserService(db)
	listingService := services.NewListingService(db)

	// Handlers
	authHandler := handlers.NewAuthHandler(authService, userService, sessionName)
	userHandler := handlers.NewUserHandler(userService)
	listingHandler := handlers.NewListingHandler(listingService)

	// Middleware
	authMiddleware := middleware.AuthMiddleware(os.Getenv("JWT_SECRET"), sessionName)

	// Routes
	router := gin.Default()
	api := router.Group("/api") 

	auth := api.Group("/auth")
	protected := api.Group("/")
	protected.Use(authMiddleware)

	RegisterAuthRoutes(auth, authHandler, authService)
	RegisterUserRoutes(protected, userHandler, userService)
	RegisterListingsRoutes(api, protected, listingHandler, listingService)

	router.Run("localhost:8080")
}
