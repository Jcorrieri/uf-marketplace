# Backend README

## Setup 
In the backend directory containing the go.mod file, start the http server with ```go run .```.

Fetch 'hello world' from the /hello-world endpoint ```curl http://localhost:8080/hello-world```.

## Project Structure
Technology Stack:
- RestAPI: Gin framework
- Database: SQLite with GORM
- Auth: TBD

Product Structure:
```
.
├── database/
│   └── database.go
├── go.mod
├── go.sum
├── handlers/               // API endpoint logic
│   └── <model>_handler.go
├── main.go
├── models/
│   └── <model>.go
├── services/               // Database operations
│   └── <model>_service.go
└── test.db
```
