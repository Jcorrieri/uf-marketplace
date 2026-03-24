describe('Sign Up Page', () => {
  // Helper: Angular Material's outline labels overlap inputs,
  // so we need {force: true} to bypass the coverage check.
  function matType(formControlName: string, value: string) {
    cy.get(`input[formControlName="${formControlName}"]`).type(value, { force: true });
  }

  beforeEach(() => {
    cy.visit('/sign-up');
  });

  it('should display the sign-up form', () => {
    cy.contains('Create Account').should('be.visible');
    cy.get('input[formControlName="firstName"]').should('exist');
    cy.get('input[formControlName="lastName"]').should('exist');
    cy.get('input[formControlName="email"]').should('exist');
    cy.get('input[formControlName="password"]').should('exist');
    cy.get('input[formControlName="confirmPassword"]').should('exist');
  });

  it('should keep Sign Up button disabled when password is too short', () => {
    matType('firstName', 'Test');
    matType('lastName', 'User');
    matType('email', 'testuser@ufl.edu');
    matType('password', 'short');
    matType('confirmPassword', 'short');

    // Button should remain disabled because password < 8 characters
    cy.get('button.signup-btn').should('be.disabled');
  });

  it('should show minlength error when password is too short', () => {
    cy.get('input[formControlName="password"]').type('short', { force: true });
    // Blur the field to trigger validation display
    cy.get('input[formControlName="password"]').blur();

    cy.contains('Password must be at least 8 characters').should('be.visible');
  });

  it('should keep Sign Up button disabled when passwords do not match', () => {
    matType('firstName', 'Test');
    matType('lastName', 'User');
    matType('email', 'testuser@ufl.edu');
    matType('password', 'ValidPass123');
    matType('confirmPassword', 'Different123');

    cy.get('button.signup-btn').should('be.disabled');
  });

  it('should show error when registering with an already taken email', () => {
    // Intercept the register API call and return a duplicate-email error
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 500,
      body: { error: 'could not create user' },
    }).as('registerRequest');

    matType('firstName', 'Test');
    matType('lastName', 'User');
    matType('email', 'user1@ufl.edu');
    matType('password', 'password123');
    matType('confirmPassword', 'password123');

    cy.get('button.signup-btn').should('not.be.disabled');
    cy.get('button.signup-btn').click();

    cy.wait('@registerRequest');
    cy.contains('could not create user').should('be.visible');
  });

  it('should enable Sign Up button with valid inputs', () => {
    matType('firstName', 'Test');
    matType('lastName', 'User');
    matType('email', 'newuser@ufl.edu');
    matType('password', 'StrongPass1');
    matType('confirmPassword', 'StrongPass1');

    cy.get('button.signup-btn').should('not.be.disabled');
  });
});
