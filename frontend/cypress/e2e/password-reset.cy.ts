describe('Password Reset Flow', () => {
  // Helper: Angular Material's outline labels overlap inputs,
  // so we need {force: true} to bypass the coverage check.
  function matType(selector: string, value: string) {
    cy.get(selector).type(value, { force: true });
  }

  /* ================================================================
   *  FORGOT PASSWORD PAGE
   * ================================================================ */
  describe('Forgot Password Page', () => {
    beforeEach(() => {
      cy.visit('/forgot-password');
    });

    it('should display the forgot password form', () => {
      cy.contains('Forgot your password?').should('be.visible');
      cy.contains('Enter your account email').should('be.visible');
      cy.get('input[type="email"]').should('exist');
      cy.contains('button', 'Continue').should('exist');
      cy.contains('Back to sign in').should('be.visible');
      cy.get('a.link').should('have.attr', 'href', '/login');
    });

    it('should keep Continue button disabled when email is empty', () => {
      cy.contains('button', 'Continue').should('be.disabled');
    });

    it('should keep Continue button disabled for invalid email', () => {
      matType('input[type="email"]', 'not-an-email');
      cy.contains('button', 'Continue').should('be.disabled');
    });

    it('should show "Email is required" when email is touched and left empty', () => {
      cy.get('input[type="email"]').focus().blur();
      cy.contains('Email is required').should('be.visible');
    });

    it('should show "Enter a valid email" for malformed email', () => {
      matType('input[type="email"]', 'bad-email');
      cy.get('input[type="email"]').blur();
      cy.contains('Enter a valid email').should('be.visible');
    });

    it('should enable Continue button with a valid email', () => {
      matType('input[type="email"]', 'user@ufl.edu');
      cy.contains('button', 'Continue').should('not.be.disabled');
    });

    it('should redirect to /reset-password with token on successful response', () => {
      cy.intercept('POST', '/api/auth/forgot-password', {
        statusCode: 200,
        body: {
          message: 'If an account exists for that email, a password reset link has been generated.',
          reset_token: 'mock-token-123',
          reset_path: '/reset-password?token=mock-token-123',
        },
      }).as('forgotRequest');

      matType('input[type="email"]', 'user@ufl.edu');
      cy.contains('button', 'Continue').click();

      cy.wait('@forgotRequest');
      cy.url().should('include', '/reset-password');
      cy.url().should('include', 'token=mock-token-123');
    });

    it('should show "No account found" when response has no token', () => {
      cy.intercept('POST', '/api/auth/forgot-password', {
        statusCode: 200,
        body: { message: 'no token' },
      }).as('forgotRequest');

      matType('input[type="email"]', 'unknown@ufl.edu');
      cy.contains('button', 'Continue').click();

      cy.wait('@forgotRequest');
      cy.contains('No account found for that email.').should('be.visible');
    });

    it('should show backend error when server returns 4xx', () => {
      cy.intercept('POST', '/api/auth/forgot-password', {
        statusCode: 400,
        body: { error: 'invalid input' },
      }).as('forgotRequest');

      matType('input[type="email"]', 'user@ufl.edu');
      cy.contains('button', 'Continue').click();

      cy.wait('@forgotRequest');
      cy.contains('invalid input').should('be.visible');
    });

    it('should navigate to /login when "Back to sign in" is clicked', () => {
      cy.contains('Back to sign in').click({ force: true });
      cy.url().should('include', '/login');
    });
  });

  /* ================================================================
   *  RESET PASSWORD PAGE
   * ================================================================ */
  describe('Reset Password Page', () => {
    it('should show error banner when visited without a token', () => {
      cy.visit('/reset-password');
      cy.contains('Missing reset token').should('be.visible');
    });

    it('should display the reset password form when token is present', () => {
      cy.visit('/reset-password?token=some-token');
      cy.contains('Reset your password').should('be.visible');
      cy.get('input[autocomplete="new-password"]').should('have.length', 2);
      cy.contains('button', 'Reset password').should('exist');
    });

    it('should keep Reset button disabled when fields are empty', () => {
      cy.visit('/reset-password?token=some-token');
      cy.contains('button', 'Reset password').should('be.disabled');
    });

    it('should show minlength error when password is too short', () => {
      cy.visit('/reset-password?token=some-token');
      cy.get('input[autocomplete="new-password"]').first().type('abc', { force: true }).blur();
      cy.contains('Password must be at least 6 characters').should('be.visible');
    });

    it('should show error when passwords do not match', () => {
      cy.visit('/reset-password?token=some-token');
      cy.get('input[autocomplete="new-password"]').first().type('password1', { force: true });
      cy.get('input[autocomplete="new-password"]').eq(1).type('password2', { force: true });
      cy.contains('button', 'Reset password').click({ force: true });

      cy.contains('Passwords do not match.').should('be.visible');
    });

    it('should show success state on successful reset', () => {
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 200,
        body: { message: 'password reset successful' },
      }).as('resetRequest');

      cy.visit('/reset-password?token=valid-token');
      cy.get('input[autocomplete="new-password"]').first().type('password1', { force: true });
      cy.get('input[autocomplete="new-password"]').eq(1).type('password1', { force: true });
      cy.contains('button', 'Reset password').click({ force: true });

      cy.wait('@resetRequest');
      cy.contains('Password updated').should('be.visible');
      cy.contains('Back to sign in').should('be.visible');
    });

    it('should display backend error when token is invalid or expired', () => {
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 400,
        body: { error: 'invalid or expired reset token' },
      }).as('resetRequest');

      cy.visit('/reset-password?token=bad-token');
      cy.get('input[autocomplete="new-password"]').first().type('password1', { force: true });
      cy.get('input[autocomplete="new-password"]').eq(1).type('password1', { force: true });
      cy.contains('button', 'Reset password').click({ force: true });

      cy.wait('@resetRequest');
      cy.contains('invalid or expired reset token').should('be.visible');
    });

    it('should navigate to /login from success screen', () => {
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 200,
        body: { message: 'password reset successful' },
      }).as('resetRequest');

      cy.visit('/reset-password?token=valid-token');
      cy.get('input[autocomplete="new-password"]').first().type('password1', { force: true });
      cy.get('input[autocomplete="new-password"]').eq(1).type('password1', { force: true });
      cy.contains('button', 'Reset password').click({ force: true });

      cy.wait('@resetRequest');
      cy.contains('button', 'Back to sign in').click({ force: true });
      cy.url().should('include', '/login');
    });
  });

  /* ================================================================
   *  ENTRY FROM LOGIN PAGE
   * ================================================================ */
  it('should navigate from login page to forgot-password via "Forgot password?" link', () => {
    cy.visit('/login');
    cy.contains('Forgot password?').click({ force: true });
    cy.url().should('include', '/forgot-password');
    cy.contains('Forgot your password?').should('be.visible');
  });
});
