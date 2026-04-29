package main

import (
	"fmt"
	"os"

	"github.com/Jcorrieri/uf-marketplace/backend/database"
	"github.com/Jcorrieri/uf-marketplace/backend/handlers"
	"github.com/Jcorrieri/uf-marketplace/backend/middleware"
	"github.com/Jcorrieri/uf-marketplace/backend/services"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
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

func RegisterPasswordResetRoutes(
	public *gin.RouterGroup,
	passwordResetHandler *handlers.PasswordResetHandler,
) {
	public.POST("/forgot-password", passwordResetHandler.ForgotPassword)
	public.POST("/reset-password", passwordResetHandler.ResetPassword)
}

func RegisterUserRoutes(
	protected *gin.RouterGroup,
	userHandler *handlers.UserHandler,
	userService *services.UserService,
) {
	protected.PUT("/users/me/profile-image", userHandler.UploadProfileImage)
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
	protected.GET("/listings/me", listingHandler.GetMyListings)
	protected.POST("/listings", listingHandler.CreateListing)
	protected.PUT("/listings/:id", listingHandler.UpdateListing)
	protected.DELETE("/listings/:id", listingHandler.DeleteListing)
}
func RegisterImageRoutes(
	public *gin.RouterGroup,
	imageHandler *handlers.ImageHandler,
) {
	public.GET("/images/:imageId", imageHandler.GetImage)
}
func RegisterOrderRoutes(
	protected *gin.RouterGroup,
	orderHandler *handlers.OrderHandler,
) {
	protected.POST("/orders", orderHandler.CreateOrder)
	protected.GET("/orders/me", orderHandler.GetMyOrders)
}
func RegisterChatRoutes(
	protected *gin.RouterGroup,
	chatHandler *handlers.ChatHandler,
) {
	protected.POST("/conversations", chatHandler.StartConversation)
	protected.GET("/conversations", chatHandler.GetConversations)
	protected.GET("/conversations/:id/messages", chatHandler.GetMessages)
	protected.GET("/ws/chat/:id", chatHandler.ServeWs)
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
	passwordResetService := services.NewPasswordResetService(db)
	userService := services.NewUserService(db)
	listingService := services.NewListingService(db)
	imageService := services.NewImageService(db)
	orderService := services.NewOrderService(db)
	chatService := services.NewChatService(db)
	// Handlers
	authHandler := handlers.NewAuthHandler(authService, userService, sessionName)
	passwordResetHandler := handlers.NewPasswordResetHandler(passwordResetService)
	userHandler := handlers.NewUserHandler(userService)
	listingHandler := handlers.NewListingHandler(listingService)
	imageHandler := handlers.NewImageHandler(imageService)
	orderHandler := handlers.NewOrderHandler(orderService, listingService)
	hub := services.NewHub()
	go hub.Run() // starts the hub's goroutine — must be before any connections arrive
	chatHandler := handlers.NewChatHandler(chatService, hub)
	// Middleware
	authMiddleware := middleware.AuthMiddleware(os.Getenv("JWT_SECRET"), sessionName)
	// Routes
	router := gin.Default()
	api := router.Group("/api")
	auth := api.Group("/auth")
	protected := api.Group("/")
	protected.Use(authMiddleware)
	RegisterAuthRoutes(auth, authHandler, authService)
	RegisterPasswordResetRoutes(auth, passwordResetHandler)
	RegisterUserRoutes(protected, userHandler, userService)
	RegisterListingsRoutes(api, protected, listingHandler, listingService)
	RegisterImageRoutes(api, imageHandler)
	RegisterOrderRoutes(protected, orderHandler)
	RegisterChatRoutes(protected, chatHandler)
	router.Run("localhost:8080")
}
