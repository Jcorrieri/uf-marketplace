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
- Response: Sets an HTTP Only cookie containing a JWT.

---

#### POST /auth/logout
Log out the current user  
- Auth: No
- Response: Success message and request to clear local cookies.

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
- Response: Message and imageID for frontend.

---

#### DELETE /users/me
Delete the current user account  
- Auth: Yes  
- Response: N/A (Should be updated to confirmation)

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
- Response: Binary image data

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

---

### Frontend:

---

### Backend:

--- 

#### Middleware:
- Missing_Cookie: Pass (Reject request missing cookie)
- Expired_Token: Pass (Reject request with expired token)
- Invalid_Secret: Pass (Reject request having token signed with invalid secret)
- Valid_Token: Pass (Accept request with valid token)

#### Models:
- TestUserResponse: Pass (Validate correct fields are present in User.GetResponse() function call)

#### Services:
- Auth Service:
  - TestAuthBadPassword: Pass (Reject login request with bad password)
  - TestAuthBadEmail: Pass (Reject login request with non-existant email)
- Image Service:
  - TestGetImageByID_Found: Pass (Returns correct image given ID)
  - TestGetImageByID_NotFound: Pass (Returns err when invalid ID is given)
- Listing Service:
  - TestNewListingService_NotNil: Pass (Service initializes successfully)
  - TestCreateListing: Pass (Creates a listing and assigns an ID)
  - TestGetListingByID_Found: Pass (Returns correct listing given ID)
  - TestGetListingByID_NotFound: Pass (Returns err when ID does not exist)
  - TestGetListingByID_InvalidID: Pass (Returns err for malformed ID)
  - TestGetAll_ReturnsResults: Pass (Returns at least one listing)
  - TestGetAll_LimitIsRespected: Pass (Returns no more results than the limit)
  - TestGetAll_CursorPagination: Pass (Returns only listings with ID less than cursor)
  - TestGetBySellerID_Found: Pass (Returns listings belonging to the given seller)
  - TestGetBySellerID_NoResults: Pass (Returns empty list for unknown seller ID)
  - TestSearch_MatchingQuery: Pass (Returns listings matching the search query)
  - TestSearch_NoMatch: Pass (Returns empty list when no listings match)
  - TestUpdateListing: Pass (Updates listing fields correctly)
  - TestReplaceImages: Pass (Replaces listing images with new set)
  - TestReplaceImages_ClearsExisting: Pass (Clears all images when given empty slice)
  - TestDeleteListing: Pass (Deletes listing and confirms it is no longer retrievable)
  - TestDeleteListing_InvalidID: Pass (Returns err for malformed UUID)
  - TestDeleteListing_NotFound: Pass (No error when deleting a non-existent record)

#### Utilities:
- JWT utils:
  - Valid_Token: Pass (Parses valid token)
  - Expired_Token: Pass (Raises err when parsing expired token)
  - Invalid_Signing_Method: Pass (Raises err when parsing token with different signing method)
