describe('Order Purchase Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('http://localhost:4200/login');
    cy.get('input[id="email"]').type('test@ufl.edu');
    cy.get('input[id="password"]').type('password123');
    cy.get('button').contains('Sign In').click();
    cy.url().should('include', '/listings');
  });

  it('should display purchase dialog when clicking buy button on a listing', () => {
    // Navigate to listings page
    cy.visit('http://localhost:4200/listings');
    
    // Find and click buy button on first listing
    cy.get('button').contains('Buy').first().click();
    
    // Verify dialog is displayed
    cy.get('.mat-mdc-dialog-container').should('be.visible');
    cy.contains('Confirm Purchase').should('be.visible');
  });

  it('should display listing details in purchase dialog', () => {
    cy.visit('http://localhost:4200/listings');
    cy.get('button').contains('Buy').first().click();
    
    // Verify dialog shows listing details
    cy.contains('Item:').should('be.visible');
    cy.contains('Seller:').should('be.visible');
    cy.contains('Total Price:').should('be.visible');
    cy.contains('$').should('be.visible');
  });

  it('should close dialog when clicking cancel button', () => {
    cy.visit('http://localhost:4200/listings');
    cy.get('button').contains('Buy').first().click();
    
    cy.get('.mat-mdc-dialog-container').should('be.visible');
    cy.get('button').contains('Cancel').click();
    cy.get('.mat-mdc-dialog-container').should('not.exist');
  });

  it('should complete purchase when confirming', () => {
    cy.visit('http://localhost:4200/listings');
    cy.get('button').contains('Buy').first().click();
    
    // Click confirm purchase button
    cy.contains('Confirm Purchase').click();
    
    // Wait for dialog to close and success message
    cy.get('.mat-mdc-dialog-container', { timeout: 5000 }).should('not.exist');
  });

  it('should display error message on purchase failure', () => {
    cy.visit('http://localhost:4200/listings');
    cy.get('button').contains('Buy').first().click();
    
    // Mock failed API response
    cy.intercept('POST', '/api/orders', { statusCode: 400, body: { error: 'Purchase failed' } });
    
    cy.contains('Confirm Purchase').click();
    cy.contains('error', { timeout: 5000 }).should('be.visible');
  });

  it('should show processing state while submitting order', () => {
    cy.visit('http://localhost:4200/listings');
    cy.get('button').contains('Buy').first().click();
    
    // Intercept with delay to see processing state
    cy.intercept('POST', '/api/orders', (req) => {
      req.reply((res) => {
        res.delay(1000);
        res.send({ statusCode: 200, body: { success: true } });
      });
    });
    
    cy.contains('Confirm Purchase').click();
    cy.contains('Processing...', { timeout: 5000 }).should('be.visible');
  });

  it('should disable buttons during processing', () => {
    cy.visit('http://localhost:4200/listings');
    cy.get('button').contains('Buy').first().click();
    
    // Intercept with delay
    cy.intercept('POST', '/api/orders', (req) => {
      req.reply((res) => {
        res.delay(1000);
        res.send({ statusCode: 200, body: { success: true } });
      });
    });
    
    cy.contains('Confirm Purchase').click();
    cy.get('button').should('be.disabled');
  });
});
