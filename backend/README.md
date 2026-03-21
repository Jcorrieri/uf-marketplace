# Backend README

## Setup 
In the backend directory containing the go.mod file, start the http server with ```go run .```.

## Project Structure
Technology Stack:
- RestAPI: Gin framework
- Database: SQLite with GORM
- Auth: JWTs with HttpOnly cookies.

Product Structure:

```
.
├── README.md
├── database
│   └── database.go
├── go.mod
├── go.sum
├── handlers
│   ├── auth_handler.go
│   ├── settings_handler.go
│   └── user_handler.go
├── main.go
├── middleware
│   ├── middleware.go
│   └── middleware_test.go
├── models
│   ├── user.go
│   └── user_test.go
├── services
│   ├── auth_service.go
│   └── user_service.go
├── test.db
└── utils
    └── jwt.go
```
