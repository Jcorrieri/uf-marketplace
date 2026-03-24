describe('Login Page', () => {
  // Helper: Angular Material's outline labels overlap inputs,
  // so we need {force: true} to bypass the coverage check.
  function matType(selector: string, value: string) {
    cy.get(selector).type(value, { force: true });
  }

  beforeEach(() => {
    cy.visit('/login');
  });

  /* ================================================================
   *  FORM DISPLAY
   * ================================================================ */
  it('should display the login form with all expected elements', () => {
    cy.contains('Welcome Back').should('be.visible');
    cy.get('input#email').should('exist');
    cy.get('input#password').should('exist');
    cy.get('button.login-btn').should('exist').and('contain.text', 'Sign In');
    cy.contains('Forgot password?').should('be.visible');
    cy.contains("Don't have an account?").should('be.visible');
    cy.get('a.signup-link').should('have.attr', 'href', '/sign-up');
  });

  it('should display the hero section on the right', () => {
    cy.contains('Buy & Sell on').should('be.visible');
    cy.contains('Verified UF Students Only').should('be.visible');
    cy.contains('Secure Transactions').should('be.visible');
    cy.contains('Campus Meetups').should('be.visible');
  });

  /* ================================================================
   *  BUTTON DISABLED STATES
   * ================================================================ */
  it('should keep Sign In button disabled when both fields are empty', () => {
    cy.get('button.login-btn').should('be.disabled');
  });

  it('should keep Sign In button disabled when only email is filled', () => {
    matType('input#email', 'user@ufl.edu');
    cy.get('button.login-btn').should('be.disabled');
  });

  it('should keep Sign In button disabled when only password is filled', () => {
    matType('input#password', 'password123');
    cy.get('button.login-btn').should('be.disabled');
  });

  it('should keep Sign In button disabled for an invalid email format', () => {
    matType('input#email', 'not-an-email');
    matType('input#password', 'password123');
    cy.get('button.login-btn').should('be.disabled');
  });

  it('should keep Sign In button disabled for email missing domain', () => {
    matType('input#email', 'user@');
    matType('input#password', 'password123');
    cy.get('button.login-btn').should('be.disabled');
  });

  /* ================================================================
   *  VALIDATION ERROR MESSAGES
   * ================================================================ */
  it('should show "Email is required" error when email is touched and left empty', () => {
    cy.get('input#email').focus().blur();
    cy.contains('Email is required').should('be.visible');
  });

  it('should show "Enter a valid email" error for a malformed email', () => {
    matType('input#email', 'bad-email');
    cy.get('input#email').blur();
    cy.contains('Enter a valid email').should('be.visible');
  });

  /* ================================================================
   *  VALID FORM — BUTTON ENABLED
   * ================================================================ */
  it('should enable Sign In button with valid email and password', () => {
    matType('input#email', 'user@ufl.edu');
    matType('input#password', 'password123');
    cy.get('button.login-btn').should('not.be.disabled');
  });

  it('should enable Sign In button with any valid email (not just @ufl.edu)', () => {
    matType('input#email', 'user@gmail.com');
    matType('input#password', 'somepassword');
    cy.get('button.login-btn').should('not.be.disabled');
  });

  /* ================================================================
   *  PASSWORD VISIBILITY TOGGLE
   * ================================================================ */
  it('should toggle password visibility when the eye icon is clicked', () => {
    matType('input#password', 'secret123');

    // Initially the input is of type "password"
    cy.get('input#password').should('have.attr', 'type', 'password');

    // Click the toggle button
    cy.get('input#password')
      .parents('mat-form-field')
      .find('button[matIconButton], button[matsuffix], button[matSuffix]')
      .click({ force: true });

    // Now it should be type "text"
    cy.get('input#password').should('have.attr', 'type', 'text');

    // Click again to hide
    cy.get('input#password')
      .parents('mat-form-field')
      .find('button[matIconButton], button[matsuffix], button[matSuffix]')
      .click({ force: true });

    cy.get('input#password').should('have.attr', 'type', 'password');
  });

  /* ================================================================
   *  SUCCESSFUL LOGIN — MOCK API
   * ================================================================ */
  it('should redirect to /main on successful login', () => {
    // Stub the login API to return success
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        id: 'abc-123',
        first_name: 'Test',
        last_name: 'User',
        email: 'testuser@ufl.edu',
      },
    }).as('loginRequest');

    // Stub the auth guard so it lets us through to /main
    cy.intercept('GET', '/api/users/me', {
      statusCode: 200,
      body: {
        id: 'abc-123',
        first_name: 'Test',
        last_name: 'User',
        email: 'testuser@ufl.edu',
      },
    }).as('meRequest');

    matType('input#email', 'testuser@ufl.edu');
    matType('input#password', 'ValidPass123');

    cy.get('button.login-btn').should('not.be.disabled');
    cy.get('button.login-btn').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/main');
  });

  /* ================================================================
   *  FAILED LOGIN — INVALID CREDENTIALS
   * ================================================================ */
  it('should show an alert when login fails with invalid credentials', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { error: 'invalid credentials' },
    }).as('loginFail');

    matType('input#email', 'testuser@ufl.edu');
    matType('input#password', 'wrongpassword');

    cy.get('button.login-btn').click();

    // The component currently uses window.alert for errors
    cy.on('window:alert', (alertText) => {
      expect(alertText).to.equal('Invalid email or password');
    });

    cy.wait('@loginFail');
  });

  it('should show an alert when the server returns a 500 error', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 500,
      body: { error: 'internal server error' },
    }).as('loginServerError');

    matType('input#email', 'testuser@ufl.edu');
    matType('input#password', 'password123');

    cy.get('button.login-btn').click();

    cy.on('window:alert', (alertText) => {
      expect(alertText).to.equal('Invalid email or password');
    });

    cy.wait('@loginServerError');
  });

  /* ================================================================
   *  NAVIGATION LINKS
   * ================================================================ */
  it('should navigate to the sign-up page when "Sign up" link is clicked', () => {
    cy.get('a.signup-link').click();
    cy.url().should('include', '/sign-up');
  });
});
