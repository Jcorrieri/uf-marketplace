# UF Marketplace (Final Name TBD)

UF student marketplace platform project for CEN5035 - Software Engineering. Our application is intended to be a platform for students at the University of Florida to exchange goods and services. Users will ideally be able to upload listings, search and view existing listings using filters/categories, access a dashboard view to manage their posts, and possibly engage in real-time messaging with sellers. Users will need to sign up with their ufl email. 

## Members
- Shakir Gamzaev (Frontend)
- Pranav Padmapada Kodihalli (Frontend/Backend)
- Jacomo Corrieri (Frontend/Backend)
- Venkata Nitchaya Reddy Konkala (Backend)

## Running Locally

Currently, the UF Marketplace application is only available locally as a demo. 

### Installation

1.) Clone the repository: 

```
$ git clone https://github.com/Jcorrieri/uf-marketplace.git
$ cd uf-marketplace
```

2.) Install frontend dependencies

We use Angular as our frontend framework and manage dependencies using npm.

```
$ cd frontend
$ npm install
```

### Starting the Backend

Our backend uses Gin for handling the API, Gorm for database management, and Gorilla for websocks.
We also use SQLite as our database solution, so no data will be exposed to the internet.

1.) Copy the example environment file `.example.env` → `.env`

(Working Directory: uf-marketplace/backend)

```
$ cd ../backend
$ cp .example.env .env
```

The credentials are already set and non-sensitive (insecure), so no changes are needed.

2.) Start the database

This will download a few images for use in the seed data (listings).

```
$ go run .
```

### Starting the Frontend

1.) After the dependencies are installed via npm the frontend can be started.

Working Directory: uf-marketplace/frontend

(In another terminal)

```
$ cd ../frontend
$ ng serve
```

## Using the application.

From here, it is straight forward to use the application. Simply sign in using one of the pre-seeded accounts
(email: 'test@ufl.edu', password: 'password') or sign up by clicking sign up. All info is stored on disk using
SQLite, so there is no risk of data exposure.  
