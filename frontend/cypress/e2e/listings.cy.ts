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

      // The edit form has two textareas (title + description); description is the 2nd.
      cy.get('.listing-card.editing textarea')
        .eq(1)
        .should('have.value', 'Calculus 2 textbook, good condition.');
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

      // Modify description (second textarea; first is the title)
      const descSelector = '.listing-card.editing textarea:eq(1)';
      matClear(descSelector);
      matType(descSelector, 'Updated description!');

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
