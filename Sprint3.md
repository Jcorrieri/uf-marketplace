# Sprint 3 Technical Documentation

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

#### Cypress E2E Tests
- Framework: Cypress 15.12.0 (Electron 138, headless).
- Summary: End-to-end tests covering the full listing CRUD lifecycle (create, read, update, delete), image upload handling, form validation, loading/error states, empty state, and auth-guard redirects. All tests use stubbed API responses.
- Tests (30 total: 13 create, 4 my-listings display, 10 edit, 5 delete, 1 empty state, 2 auth guard):
  - Create Listing page
    - [frontend/cypress/e2e/listings.cy.ts](frontend/cypress/e2e/listings.cy.ts)
    - Tests:
      - should display all form elements
        - Details: Visits `/create-listing`, asserts "Create Listing" heading, file input, add-image button, title input, description textarea, price input, and "Post Listing" submit button all exist.
      - should have a back button that navigates to /profile
        - Details: Asserts the `.back-btn` element exists on the page.
      - should show error when submitting without a title
        - Details: Fills description and price but no title; clicks submit; expects "Title is required".
      - should show error when submitting without a description
        - Details: Fills title and price but no description; clicks submit; expects "Description is required".
      - should show error when submitting without a price
        - Details: Fills title and description but no price; clicks submit; expects "Please enter a valid price".
      - should show error when price is negative
        - Details: Fills all fields with price `-5`; clicks submit; expects "Please enter a valid price".
      - should call POST /api/listings and navigate to /main on success
        - Details: Intercepts `POST /api/listings` (201); fills valid form data; clicks submit; asserts URL includes `/main`.
      - should display server error message when creation fails
        - Details: Intercepts `POST /api/listings` (400); fills form; clicks submit; expects server error message to be visible.
      - should display generic error when server is unreachable
        - Details: Forces network error on `POST /api/listings`; fills form; clicks submit; expects "Unable to reach the server".
      - should show "Posting…" text while submitting
        - Details: Intercepts `POST /api/listings` with 1s delay; fills form; clicks submit; asserts button text is "Posting…" and button is disabled.
      - should allow adding images via the file input
        - Details: Selects a fake PNG file via the file input; asserts `.image-preview-card` count is 1.
      - should allow removing an added image
        - Details: Adds an image, clicks `.remove-img-btn`; asserts `.image-preview-card` count returns to 0.
      - should allow adding multiple images
        - Details: Selects two fake image files at once; asserts `.image-preview-card` count is 2.
  - My Listings page (display)
    - Tests:
      - should display all user listings
        - Details: Stubs `GET /api/listings/me` with two listings; asserts 2 `.listing-card` elements, "Used Textbook" and "Desk Lamp" visible.
      - should show title, description, price, and action buttons for each listing
        - Details: Asserts title, description, "$25.00" price, and 2 edit + 2 delete buttons are present.
      - should display an image for listings with first_image_id
        - Details: Asserts first listing card's `.listing-image` src equals `/api/images/img-1`.
      - should display a placeholder for listings without images
        - Details: Asserts second listing card has a `.listing-image-placeholder` element.
  - My Listings page – Edit Listing
    - Tests:
      - should enter edit mode when clicking Edit button
        - Details: Clicks `.edit-btn`; asserts `.listing-card.editing` appears with textarea, number input, Save, and Cancel buttons.
      - should pre-fill description and price in edit mode
        - Details: Clicks edit; asserts textarea value is the original description and price input value is `25`.
      - should cancel edit mode when clicking Cancel
        - Details: Enters edit mode, clicks Cancel; asserts `.listing-card.editing` disappears and original description is still shown.
      - should call PUT /api/listings/:id and update the card on success
        - Details: Intercepts `PUT /api/listings/listing-1` (200); clears and types new description/price; clicks Save; asserts edit mode exits and new values are visible.
      - should show "Saving..." text while the update is in progress
        - Details: Intercepts PUT with 2s delay; clicks Save; asserts button text is "Saving..." and is disabled.
      - should display error when update fails
        - Details: Intercepts PUT (500); clicks Save; expects "Internal server error" text.
      - should display generic error when server is unreachable during update
        - Details: Forces network error on PUT; clicks Save; expects "Unable to reach the server".
      - should show error when saving with a negative price
        - Details: In edit mode, types `-10` for price; clicks Save; expects "Price must be positive".
      - should allow adding new images in edit mode
        - Details: In edit mode, selects a fake image file; asserts `.image-preview` count is 1.
      - should allow removing new images in edit mode
        - Details: In edit mode, adds then removes an image; asserts `.image-preview` count returns to 0.
  - My Listings page – Delete Listing
    - Tests:
      - should show a confirmation dialog before deleting
        - Details: Stubs `window:confirm` to return false; clicks delete; asserts 2 listing cards still present.
      - should call DELETE /api/listings/:id and remove the card on confirm
        - Details: Intercepts `DELETE /api/listings/listing-1` (200); confirms dialog; asserts 1 card remains and "Used Textbook" is gone.
      - should display error when delete fails
        - Details: Intercepts DELETE (403); confirms; expects "You are not authorized to delete this listing" and 2 cards still present.
      - should display generic error when server is unreachable during delete
        - Details: Forces network error on DELETE; confirms; expects "Unable to reach the server" and 2 cards still present.
      - should delete all listings and show empty state
        - Details: Deletes both listings sequentially; asserts 0 cards and "You haven't posted any listings yet." message.
  - My Listings page – Empty State
    - Tests:
      - should show empty state message when user has no listings
        - Details: Stubs `GET /api/listings/me` with empty array; asserts "You haven't posted any listings yet." and 0 `.listing-card` elements.
  - Listing Pages – Auth Guard
    - Tests:
      - should redirect to /login when visiting /create-listing unauthenticated
        - Details: Stubs `GET /api/users/me` (401); visits `/create-listing`; asserts URL includes `/login`.
      - should redirect to /login when visiting /my-listings unauthenticated
        - Details: Stubs `GET /api/users/me` (401); visits `/my-listings`; asserts URL includes `/login`.
  - Result: PASS (30 passing, 0 failing)

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
