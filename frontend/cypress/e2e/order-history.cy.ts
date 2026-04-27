/**
 * Cypress E2E tests for the Order History page (/orders).
 */

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

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

const ORDER_A = {
  order_id: 'aaaaaaaa-1111-2222-3333-444444444444',
  listing_id: 'listing-1',
  title: 'Used Calculus Textbook',
  description: 'Calc 2 textbook in great shape.',
  price: 30,
  first_image_id: 'img-1',
  seller_name: 'Albert Gator',
  purchased_at: '2026-01-15T10:00:00.000Z',
  status: 'Completed',
};

const ORDER_B = {
  order_id: 'bbbbbbbb-1111-2222-3333-444444444444',
  listing_id: 'listing-2',
  title: 'Mini Fridge',
  description: 'Compact dorm fridge, lightly used.',
  price: 70,
  first_image_id: null,
  seller_name: 'Sandra Seller',
  purchased_at: '2026-02-20T14:30:00.000Z',
  status: 'Shipped',
};

/* ================================================================== */
/*  Tests                                                             */
/* ================================================================== */

describe('Order History Page', () => {
  beforeEach(() => {
    stubAuth();
  });

  /* ---------------- Empty state ---------------- */
  it('should render the empty state when the user has no orders', () => {
    cy.intercept('GET', '/api/orders/me', {
      statusCode: 200,
      body: [],
    }).as('getOrders');

    cy.visit('/orders');
    cy.wait('@getOrders');

    cy.contains('.page-title', 'Order History').should('be.visible');
    cy.get('.empty-state').should('be.visible');
    cy.contains('No orders yet').should('be.visible');
    cy.contains('button.browse-btn', 'Browse Marketplace').should('be.visible');
    cy.get('.order-card').should('not.exist');
    cy.get('.summary-card').should('not.exist');
  });

  it('should navigate back to /main when "Browse Marketplace" is clicked', () => {
    cy.intercept('GET', '/api/orders/me', { statusCode: 200, body: [] }).as('getOrders');

    cy.visit('/orders');
    cy.wait('@getOrders');

    cy.contains('button.browse-btn', 'Browse Marketplace').click();
    cy.url().should('include', '/main');
  });

  /* ---------------- Loaded state ---------------- */
  it('should render the order list and summary card when orders exist', () => {
    cy.intercept('GET', '/api/orders/me', {
      statusCode: 200,
      body: [ORDER_A, ORDER_B],
    }).as('getOrders');

    cy.visit('/orders');
    cy.wait('@getOrders');

    cy.get('.empty-state').should('not.exist');
    cy.get('.order-card').should('have.length', 2);

    // Order titles + sellers visible
    cy.contains('.order-title', 'Used Calculus Textbook').should('be.visible');
    cy.contains('.order-title', 'Mini Fridge').should('be.visible');
    cy.contains('Albert Gator').should('be.visible');
    cy.contains('Sandra Seller').should('be.visible');

    // Summary card shows count and total spent (30 + 70 = 100)
    cy.get('.summary-card').should('be.visible');
    cy.get('.summary-card').contains('.summary-value', '2').should('be.visible');
    cy.get('.summary-card').contains('.summary-value', '$100').should('be.visible');
  });

  it('should render an image for orders with first_image_id and a placeholder otherwise', () => {
    cy.intercept('GET', '/api/orders/me', {
      statusCode: 200,
      body: [ORDER_A, ORDER_B],
    }).as('getOrders');

    cy.visit('/orders');
    cy.wait('@getOrders');

    cy.get('img.order-image')
      .should('have.length', 1)
      .and('have.attr', 'src')
      .and('include', '/api/images/img-1');

    cy.get('.order-image-placeholder').should('have.length', 1);
  });

  it('should display the correct status badge for each order', () => {
    cy.intercept('GET', '/api/orders/me', {
      statusCode: 200,
      body: [ORDER_A, ORDER_B],
    }).as('getOrders');

    cy.visit('/orders');
    cy.wait('@getOrders');

    cy.get('.status-badge.status-completed').should('contain.text', 'Completed');
    cy.get('.status-badge.status-shipped').should('contain.text', 'Shipped');
  });

  /* ---------------- Navigation ---------------- */
  it('should navigate back to /main when the back button is clicked', () => {
    cy.intercept('GET', '/api/orders/me', { statusCode: 200, body: [] }).as('getOrders');

    cy.visit('/orders');
    cy.wait('@getOrders');

    cy.get('button.back-btn').click();
    cy.url().should('include', '/main');
  });

  it('should navigate to /product/:id when "View product" is clicked', () => {
    cy.intercept('GET', '/api/orders/me', {
      statusCode: 200,
      body: [ORDER_A],
    }).as('getOrders');

    cy.visit('/orders');
    cy.wait('@getOrders');

    cy.contains('button', 'View product').click({ force: true });
    cy.url().should('include', '/product/listing-1');
  });

  it('should keep the "Contact seller" button disabled', () => {
    cy.intercept('GET', '/api/orders/me', {
      statusCode: 200,
      body: [ORDER_A],
    }).as('getOrders');

    cy.visit('/orders');
    cy.wait('@getOrders');

    cy.contains('button', 'Contact seller').should('be.disabled');
  });

  /* ---------------- Error handling ---------------- */
  it('should fall back to the empty state when the orders API fails', () => {
    cy.intercept('GET', '/api/orders/me', {
      statusCode: 500,
      body: { error: 'internal server error' },
    }).as('getOrdersFail');

    cy.visit('/orders');
    cy.wait('@getOrdersFail');

    cy.get('.empty-state').should('be.visible');
    cy.contains('No orders yet').should('be.visible');
    cy.get('.order-card').should('not.exist');
  });

  /* ---------------- Auth guard ---------------- */
  it('should redirect to /login when the user is not authenticated', () => {
    // Override the auth stub from beforeEach so the guard rejects.
    cy.intercept('GET', '/api/users/me', {
      statusCode: 401,
      body: { error: 'unauthenticated' },
    }).as('authReject');
    cy.intercept('GET', '/api/orders/me', { statusCode: 200, body: [] });

    cy.visit('/orders');
    cy.url().should('include', '/login');
  });
});
