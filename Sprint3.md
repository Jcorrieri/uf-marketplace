# Sprint 2 Techincal Documentation

---

## Summary

### Team
- Shakir Gamzaev (Frontend)
- Pranav Padmapada Kodihalli (Frontend/Backend)
- Jacomo Corrieri (Frontend/Backend)
- Venkata Nitchaya Reddy Konkala (Backend)

### Sprint Goals
- Complete remaining Sprint 2 issues
- Add listings integration
- Add search functionality that queries DB
- Update backend API

### Summary of Work Completed
- Successfully implemented search with cursor to load next k listings
- Users can now change their profile pictures, which are stored on the database
- Users can now create and upload listings with pictures. 
- Users can edit and delete existing listings

---

## API Documentation

Base URL:
http://localhost:8080/api

---

### Auth Endpoints (/auth)
Public routes (no authentication required)

#### POST /auth/register
Create a new user account  
- Auth: No  
- Body: User credentials (e.g., email, password)  
- Response: Created user or success message  

---

#### POST /auth/login
Authenticate a user and start a session  
- Auth: No  
- Body: Login credentials  
- Response: Session cookie or token  

---

#### POST /auth/logout
Log out the current user  
- Auth: Typically no (may rely on session cookie)  
- Response: Success message  

---

### User Endpoints (/users)
Protected routes (authentication required)

#### GET /users/me
Get the currently authenticated user  
- Auth: Yes  
- Response: Current user object  

---

#### PUT /users/me
Update current user settings  
- Auth: Yes  
- Body: Fields to update  
- Response: Updated user  

---

#### PUT /users/me/profile-image
Upload or update profile image  
- Auth: Yes  
- Body: multipart/form-data (image file)  
- Response: Updated user or image reference  

---

#### DELETE /users/me
Delete the current user account  
- Auth: Yes  
- Response: Confirmation of deletion  

---

#### GET /users/:id
Get a user by ID  
- Auth: Yes  
- Params:  
  - id: User ID  
- Response: User object  

---

### Listings Endpoints (/listings)

#### GET /listings
Fetch all listings  
- Auth: No  
- Response: List of listings  

---

#### POST /listings
Create a new listing  
- Auth: Yes  
- Body: Listing data (title, description, price, etc.)  
- Response: Created listing  

---

### Image Endpoints (/images)

#### GET /images/:imageId
Retrieve an image by ID  
- Auth: No  
- Params:  
  - imageId: Image identifier  
- Response: Image file or binary data  

---

### Authentication Details

- Protected routes use JWT-based middleware  
- Session stored via cookie (SESSION_COOKIE_NAME, default: session_token)  

---

### Route Summary

| Group     | Prefix      | Auth Required |
|----------|------------|--------------|
| Auth     | /auth      | No           |
| Users    | /users     | Yes          |
| Listings | /listings  | Mixed        |
| Images   | /images    | No           |

## Testing Overview:

TBD
