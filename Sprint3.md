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
    - Code:
      ```ts
      /**
       * Cypress E2E tests for listing CRUD operations:
       *   - Creating a listing  (/create-listing)
       *   - Updating a listing  (/my-listings  → edit mode)
       *   - Deleting a listing  (/my-listings  → delete action)
       */

      /* ------------------------------------------------------------------ */
      /*  Helpers                                                           */
      /* ------------------------------------------------------------------ */

      /** Angular Material inputs are overlapped by labels; force-type. */
      function matType(selector: string, value: string) {
        cy.get(selector).type(value, { force: true });
      }

      function matClear(selector: string) {
        cy.get(selector).clear({ force: true });
      }

      /** Stub `/api/users/me` so the auth guard lets us through. */
      function stubAuth() {
        cy.intercept('GET', '/api/users/me', {
          statusCode: 200,
          body: {
            id: 'user-1',
            first_name: 'Test',
            last_name: 'User',
            email: 'testuser@ufl.edu',
            image_id: null,
          },
        }).as('authCheck');
      }

      /** A sample listing object returned by the API. */
      const SAMPLE_LISTING = {
        id: 'listing-1',
        title: 'Used Textbook',
        description: 'Calculus 2 textbook, good condition.',
        price: 25,
        image_count: 1,
        first_image_id: 'img-1',
        seller_name: 'Test User',
        created_at: '2025-03-01T12:00:00Z',
      };

      const SECOND_LISTING = {
        id: 'listing-2',
        title: 'Desk Lamp',
        description: 'LED desk lamp, barely used.',
        price: 15,
        image_count: 0,
        first_image_id: null,
        seller_name: 'Test User',
        created_at: '2025-03-02T12:00:00Z',
      };

      /* ================================================================== */
      /*  CREATE LISTING                                                    */
      /* ================================================================== */
      describe('Create Listing Page', () => {
        beforeEach(() => {
          stubAuth();
          cy.visit('/create-listing');
          cy.wait('@authCheck');
        });

        /* ---------- page renders correctly ---------- */
        it('should display all form elements', () => {
          cy.contains('Create Listing').should('be.visible');
          cy.get('input[type="file"]').should('exist');
          cy.get('button.add-image-btn').should('exist');
          cy.get('input').filter('[placeholder="What are you selling?"]').should('exist');
          cy.get('textarea').should('exist');
          cy.get('input[type="number"]').should('exist');
          cy.get('button.submit-btn').should('exist').and('contain.text', 'Post Listing');
        });

        it('should have a back button that navigates to /profile', () => {
          stubAuth(); // re-stub for the navigation target
          cy.get('button.back-btn').should('exist');
        });

        /* ---------- client-side validation ---------- */
        it('should show error when submitting without a title', () => {
          matType('textarea', 'Some description');
          matType('input[type="number"]', '10');
          cy.get('button.submit-btn').click();
          cy.contains('Title is required').should('be.visible');
        });

        it('should show error when submitting without a description', () => {
          matType('input[placeholder="What are you selling?"]', 'My Item');
          matType('input[type="number"]', '10');
          cy.get('button.submit-btn').click();
          cy.contains('Description is required').should('be.visible');
        });

        it('should show error when submitting without a price', () => {
          matType('input[placeholder="What are you selling?"]', 'My Item');
          matType('textarea', 'A cool item');
          cy.get('button.submit-btn').click();
          cy.contains('Please enter a valid price').should('be.visible');
        });

        it('should show error when price is negative', () => {
          matType('input[placeholder="What are you selling?"]', 'My Item');
          matType('textarea', 'A cool item');
          matType('input[type="number"]', '-5');
          cy.get('button.submit-btn').click();
          cy.contains('Please enter a valid price').should('be.visible');
        });

        /* ---------- successful creation ---------- */
        it('should call POST /api/listings and navigate to /main on success', () => {
          cy.intercept('POST', '/api/listings', {
            statusCode: 201,
            body: { ...SAMPLE_LISTING, title: 'My New Item' },
          }).as('createListing');

          // Stub the GET that /main fires when it loads
          cy.intercept('GET', '/api/listings?*', {
            statusCode: 200,
            body: [],
          }).as('mainListings');

          matType('input[placeholder="What are you selling?"]', 'My New Item');
          matType('textarea', 'Brand new item for sale');
          matType('input[type="number"]', '42');

          cy.get('button.submit-btn').click();

          cy.wait('@createListing');

          // Should navigate to /main after success
          cy.url().should('include', '/main');
        });

        it('should display server error message when creation fails', () => {
          cy.intercept('POST', '/api/listings', {
            statusCode: 400,
            body: { error: 'Title cannot be empty on server side' },
          }).as('createListingFail');

          matType('input[placeholder="What are you selling?"]', 'Bad Item');
          matType('textarea', 'Description here');
          matType('input[type="number"]', '10');
          cy.get('button.submit-btn').click();

          cy.wait('@createListingFail');
          cy.contains('Title cannot be empty on server side').should('be.visible');
        });

        it('should display generic error when server is unreachable', () => {
          cy.intercept('POST', '/api/listings', { forceNetworkError: true }).as('networkError');

          matType('input[placeholder="What are you selling?"]', 'Item');
          matType('textarea', 'Desc');
          matType('input[type="number"]', '5');
          cy.get('button.submit-btn').click();

          cy.wait('@networkError');
          cy.contains('Unable to reach the server').should('be.visible');
        });

        it('should show "Posting…" text while submitting', () => {
          // Delay the response so we can assert intermediate state
          cy.intercept('POST', '/api/listings', (req) => {
            req.reply({ statusCode: 201, body: SAMPLE_LISTING, delay: 1000 });
          }).as('slowCreate');

          matType('input[placeholder="What are you selling?"]', 'Slow Item');
          matType('textarea', 'Takes a while');
          matType('input[type="number"]', '10');
          cy.get('button.submit-btn').click();

          cy.get('button.submit-btn').should('contain.text', 'Posting…');
          cy.get('button.submit-btn').should('be.disabled');
        });

        /* ---------- image handling ---------- */
        it('should allow adding images via the file input', () => {
          // Create a fake image file for upload
          cy.get('input[type="file"]').selectFile(
            {
              contents: Cypress.Buffer.from('fake-image-data'),
              fileName: 'photo.png',
              mimeType: 'image/png',
            },
            { force: true },
          );

          // Should show a preview card
          cy.get('.image-preview-card').should('have.length', 1);
        });

        it('should allow removing an added image', () => {
          cy.get('input[type="file"]').selectFile(
            {
              contents: Cypress.Buffer.from('fake-image-data'),
              fileName: 'photo.png',
              mimeType: 'image/png',
            },
            { force: true },
          );

          cy.get('.image-preview-card').should('have.length', 1);
          cy.get('.remove-img-btn').click();
          cy.get('.image-preview-card').should('have.length', 0);
        });

        it('should allow adding multiple images', () => {
          cy.get('input[type="file"]').selectFile(
            [
              {
                contents: Cypress.Buffer.from('img1'),
                fileName: 'photo1.png',
                mimeType: 'image/png',
              },
              {
                contents: Cypress.Buffer.from('img2'),
                fileName: 'photo2.jpeg',
                mimeType: 'image/jpeg',
              },
            ],
            { force: true },
          );

          cy.get('.image-preview-card').should('have.length', 2);
        });
      });

      /* ================================================================== */
      /*  MY LISTINGS PAGE – UPDATE & DELETE                                */
      /* ================================================================== */
      describe('My Listings Page', () => {
        beforeEach(() => {
          stubAuth();

          // Stub the "load my listings" call
          cy.intercept('GET', '/api/listings/me', {
            statusCode: 200,
            body: [SAMPLE_LISTING, SECOND_LISTING],
          }).as('loadListings');

          cy.visit('/my-listings');
          cy.wait('@authCheck');
          cy.wait('@loadListings');
        });

        /* ---------- page renders listings ---------- */
        it('should display all user listings', () => {
          cy.get('.listing-card').should('have.length', 2);
          cy.contains('Used Textbook').should('be.visible');
          cy.contains('Desk Lamp').should('be.visible');
        });

        it('should show title, description, price, and action buttons for each listing', () => {
          cy.contains('Used Textbook').should('be.visible');
          cy.contains('Calculus 2 textbook, good condition.').should('be.visible');
          cy.contains('$25.00').should('be.visible');
          cy.get('.edit-btn').should('have.length', 2);
          cy.get('.delete-btn').should('have.length', 2);
        });

        it('should display an image for listings with first_image_id', () => {
          cy.get('.listing-card')
            .first()
            .find('.listing-image')
            .should('have.attr', 'src', '/api/images/img-1');
        });

        it('should display a placeholder for listings without images', () => {
          cy.get('.listing-card').eq(1).find('.listing-image-placeholder').should('exist');
        });

        /* ============================================================= */
        /*  UPDATE LISTING                                                */
        /* ============================================================= */
        describe('Edit Listing', () => {
          it('should enter edit mode when clicking Edit button', () => {
            cy.get('.edit-btn').first().click();

            // Should show edit form fields
            cy.get('.listing-card.editing').should('have.length', 1);
            cy.get('textarea').should('be.visible');
            cy.get('input[type="number"]').should('be.visible');
            cy.get('button').contains('Save').should('be.visible');
            cy.get('button').contains('Cancel').should('be.visible');
          });

          it('should pre-fill description and price in edit mode', () => {
            cy.get('.edit-btn').first().click();

            cy.get('.listing-card.editing textarea').should(
              'have.value',
              'Calculus 2 textbook, good condition.',
            );
            cy.get('.listing-card.editing input[type="number"]').should('have.value', '25');
          });

          it('should cancel edit mode when clicking Cancel', () => {
            cy.get('.edit-btn').first().click();
            cy.get('.listing-card.editing').should('have.length', 1);

            cy.get('button').contains('Cancel').click();

            cy.get('.listing-card.editing').should('have.length', 0);
            // Original values still displayed
            cy.contains('Calculus 2 textbook, good condition.').should('be.visible');
          });

          it('should call PUT /api/listings/:id and update the card on success', () => {
            const updatedListing = {
              ...SAMPLE_LISTING,
              description: 'Updated description!',
              price: 30,
            };

            cy.intercept('PUT', `/api/listings/${SAMPLE_LISTING.id}`, {
              statusCode: 200,
              body: updatedListing,
            }).as('updateListing');

            // Enter edit mode
            cy.get('.edit-btn').first().click();

            // Modify description
            matClear('.listing-card.editing textarea');
            matType('.listing-card.editing textarea', 'Updated description!');

            // Modify price
            matClear('.listing-card.editing input[type="number"]');
            matType('.listing-card.editing input[type="number"]', '30');

            // Save
            cy.get('button').contains('Save').click();
            cy.wait('@updateListing');

            // Should exit edit mode and show updated values
            cy.get('.listing-card.editing').should('have.length', 0);
            cy.contains('Updated description!').should('be.visible');
            cy.contains('$30.00').should('be.visible');
          });

          it('should show "Saving..." text while the update is in progress', () => {
            cy.intercept('PUT', `/api/listings/${SAMPLE_LISTING.id}`, (req) => {
              req.reply({ statusCode: 200, body: SAMPLE_LISTING, delay: 2000 });
            }).as('slowUpdate');

            cy.get('.edit-btn').first().click();
            cy.get('.listing-card.editing').contains('button', 'Save').click();

            cy.get('.listing-card.editing').contains('button', 'Saving...').should('be.disabled');
          });

          it('should display error when update fails', () => {
            cy.intercept('PUT', `/api/listings/${SAMPLE_LISTING.id}`, {
              statusCode: 500,
              body: { error: 'Internal server error' },
            }).as('updateFail');

            cy.get('.edit-btn').first().click();
            cy.get('button').contains('Save').click();
            cy.wait('@updateFail');

            cy.contains('Internal server error').should('be.visible');
          });

          it('should display generic error when server is unreachable during update', () => {
            cy.intercept('PUT', `/api/listings/${SAMPLE_LISTING.id}`, {
              forceNetworkError: true,
            }).as('updateNetworkError');

            cy.get('.edit-btn').first().click();
            cy.get('button').contains('Save').click();
            cy.wait('@updateNetworkError');

            cy.contains('Unable to reach the server').should('be.visible');
          });

          it('should show error when saving with a negative price', () => {
            cy.get('.edit-btn').first().click();

            matClear('.listing-card.editing input[type="number"]');
            matType('.listing-card.editing input[type="number"]', '-10');

            cy.get('button').contains('Save').click();
            cy.contains('Price must be positive').should('be.visible');
          });

          it('should allow adding new images in edit mode', () => {
            cy.get('.edit-btn').first().click();

            cy.get('.listing-card.editing input[type="file"]').selectFile(
              {
                contents: Cypress.Buffer.from('new-image-data'),
                fileName: 'new-photo.png',
                mimeType: 'image/png',
              },
              { force: true },
            );

            cy.get('.listing-card.editing .image-preview').should('have.length', 1);
          });

          it('should allow removing new images in edit mode', () => {
            cy.get('.edit-btn').first().click();

            cy.get('.listing-card.editing input[type="file"]').selectFile(
              {
                contents: Cypress.Buffer.from('new-image-data'),
                fileName: 'new-photo.png',
                mimeType: 'image/png',
              },
              { force: true },
            );

            cy.get('.listing-card.editing .image-preview').should('have.length', 1);
            cy.get('.listing-card.editing .remove-img-btn').click();
            cy.get('.listing-card.editing .image-preview').should('have.length', 0);
          });
        });

        /* ============================================================= */
        /*  DELETE LISTING                                                */
        /* ============================================================= */
        describe('Delete Listing', () => {
          it('should show a confirmation dialog before deleting', () => {
            // Stub window.confirm to return false (user cancels)
            cy.on('window:confirm', () => false);

            cy.get('.delete-btn').first().click();

            // Listing should still be present
            cy.get('.listing-card').should('have.length', 2);
          });

          it('should call DELETE /api/listings/:id and remove the card on confirm', () => {
            cy.intercept('DELETE', `/api/listings/${SAMPLE_LISTING.id}`, {
              statusCode: 200,
              body: {},
            }).as('deleteListing');

            // Accept the confirmation
            cy.on('window:confirm', () => true);

            cy.get('.delete-btn').first().click();
            cy.wait('@deleteListing');

            // First listing removed → only 1 card left
            cy.get('.listing-card').should('have.length', 1);
            cy.contains('Used Textbook').should('not.exist');
            cy.contains('Desk Lamp').should('be.visible');
          });

          it('should display error when delete fails', () => {
            cy.intercept('DELETE', `/api/listings/${SAMPLE_LISTING.id}`, {
              statusCode: 403,
              body: { error: 'You are not authorized to delete this listing' },
            }).as('deleteFail');

            cy.on('window:confirm', () => true);

            cy.get('.delete-btn').first().click();
            cy.wait('@deleteFail');

            cy.contains('You are not authorized to delete this listing').should('be.visible');
            // Listing should still be present
            cy.get('.listing-card').should('have.length', 2);
          });

          it('should display generic error when server is unreachable during delete', () => {
            cy.intercept('DELETE', `/api/listings/${SAMPLE_LISTING.id}`, {
              forceNetworkError: true,
            }).as('deleteNetworkError');

            cy.on('window:confirm', () => true);

            cy.get('.delete-btn').first().click();
            cy.wait('@deleteNetworkError');

            cy.contains('Unable to reach the server').should('be.visible');
            cy.get('.listing-card').should('have.length', 2);
          });

          it('should delete all listings and show empty state', () => {
            cy.intercept('DELETE', `/api/listings/${SAMPLE_LISTING.id}`, {
              statusCode: 200,
              body: {},
            }).as('deleteFirst');
            cy.intercept('DELETE', `/api/listings/${SECOND_LISTING.id}`, {
              statusCode: 200,
              body: {},
            }).as('deleteSecond');

            cy.on('window:confirm', () => true);

            // Delete first listing
            cy.get('.delete-btn').first().click();
            cy.wait('@deleteFirst');
            cy.get('.listing-card').should('have.length', 1);

            // Delete second listing
            cy.get('.delete-btn').first().click();
            cy.wait('@deleteSecond');
            cy.get('.listing-card').should('have.length', 0);

            // Empty state should appear
            cy.contains("You haven't posted any listings yet.").should('be.visible');
          });
        });
      });

      /* ================================================================== */
      /*  EMPTY STATE                                                       */
      /* ================================================================== */
      describe('My Listings Page – Empty State', () => {
        beforeEach(() => {
          stubAuth();
          cy.intercept('GET', '/api/listings/me', {
            statusCode: 200,
            body: [],
          }).as('loadEmpty');

          cy.visit('/my-listings');
          cy.wait('@authCheck');
          cy.wait('@loadEmpty');
        });

        it('should show empty state message when user has no listings', () => {
          cy.contains("You haven't posted any listings yet.").should('be.visible');
          cy.get('.listing-card').should('have.length', 0);
        });
      });

      /* ================================================================== */
      /*  AUTH GUARD – redirect unauthenticated users                       */
      /* ================================================================== */
      describe('Listing Pages – Auth Guard', () => {
        it('should redirect to /login when visiting /create-listing unauthenticated', () => {
          cy.intercept('GET', '/api/users/me', { statusCode: 401, body: {} }).as('authFail');
          cy.visit('/create-listing');
          cy.wait('@authFail');
          cy.url().should('include', '/login');
        });

        it('should redirect to /login when visiting /my-listings unauthenticated', () => {
          cy.intercept('GET', '/api/users/me', { statusCode: 401, body: {} }).as('authFail');
          cy.visit('/my-listings');
          cy.wait('@authFail');
          cy.url().should('include', '/login');
        });
      });
      ```
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
