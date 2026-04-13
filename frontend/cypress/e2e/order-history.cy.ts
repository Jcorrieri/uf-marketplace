describe('Order History Page', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('http://localhost:4200/login');
    cy.get('input[id="email"]').type('test@ufl.edu');
    cy.get('input[id="password"]').type('password123');
    cy.get('button').contains('Sign In').click();
    cy.url().should('include', '/listings');
  });

  it('should navigate to order history page', () => {
    cy.visit('http://localhost:4200/order-history');
    cy.contains('Order History').should('be.visible');
  });

  it('should display empty state when no orders exist', () => {
    cy.intercept('GET', '/api/orders', { statusCode: 200, body: { orders: [] } });
    
    cy.visit('http://localhost:4200/order-history');
    cy.contains('No orders yet').should('be.visible');
    cy.contains('Items you purchase will appear here').should('be.visible');
  });

  it('should display loading spinner while fetching orders', () => {
    cy.intercept('GET', '/api/orders', (req) => {
      req.reply((res) => {
        res.delay(1000);
        res.send({ statusCode: 200, body: { orders: [] } });
      });
    });
    
    cy.visit('http://localhost:4200/order-history');
    cy.get('mat-spinner').should('be.visible');
  });

  it('should display list of orders', () => {
    const mockOrders = {
      orders: [
        {
          id: 1,
          listing_name: 'Test Textbook',
          seller_name: 'John Doe',
          price: 49.99,
          status: 'completed',
          created_at: '2026-04-10T10:00:00Z'
        },
        {
          id: 2,
          listing_name: 'Used Laptop',
          seller_name: 'Jane Smith',
          price: 299.99,
          status: 'pending',
          created_at: '2026-04-11T15:30:00Z'
        }
      ]
    };
    
    cy.intercept('GET', '/api/orders', { statusCode: 200, body: mockOrders });
    
    cy.visit('http://localhost:4200/order-history');
    cy.contains('Order #1').should('be.visible');
    cy.contains('Order #2').should('be.visible');
    cy.contains('Test Textbook').should('be.visible');
    cy.contains('Used Laptop').should('be.visible');
  });

  it('should display order details correctly', () => {
    const mockOrder = {
      orders: [
        {
          id: 1,
          listing_name: 'Physics Textbook',
          seller_name: 'Alice Johnson',
          price: 75.50,
          status: 'completed',
          created_at: '2026-04-10T10:00:00Z'
        }
      ]
    };
    
    cy.intercept('GET', '/api/orders', { statusCode: 200, body: mockOrder });
    
    cy.visit('http://localhost:4200/order-history');
    cy.contains('Order #1').should('be.visible');
    cy.contains('Completed').should('be.visible');
    cy.contains('Physics Textbook').should('be.visible');
    cy.contains('Alice Johnson').should('be.visible');
    cy.contains('$75.50').should('be.visible');
  });

  it('should display different status badges for pending orders', () => {
    const mockOrder = {
      orders: [
        {
          id: 1,
          listing_name: 'Test Item',
          seller_name: 'Test Seller',
          price: 50.00,
          status: 'pending',
          created_at: '2026-04-11T15:30:00Z'
        }
      ]
    };
    
    cy.intercept('GET', '/api/orders', { statusCode: 200, body: mockOrder });
    
    cy.visit('http://localhost:4200/order-history');
    cy.contains('Pending').should('have.class', 'status-badge');
  });

  it('should show cancel button for pending orders', () => {
    const mockOrder = {
      orders: [
        {
          id: 1,
          listing_name: 'Test Item',
          seller_name: 'Test Seller',
          price: 50.00,
          status: 'pending',
          created_at: '2026-04-11T15:30:00Z'
        }
      ]
    };
    
    cy.intercept('GET', '/api/orders', { statusCode: 200, body: mockOrder });
    
    cy.visit('http://localhost:4200/order-history');
    cy.contains('Cancel Order').should('be.visible');
  });

  it('should not show cancel button for completed orders', () => {
    const mockOrder = {
      orders: [
        {
          id: 1,
          listing_name: 'Test Item',
          seller_name: 'Test Seller',
          price: 50.00,
          status: 'completed',
          created_at: '2026-04-10T10:00:00Z'
        }
      ]
    };
    
    cy.intercept('GET', '/api/orders', { statusCode: 200, body: mockOrder });
    
    cy.visit('http://localhost:4200/order-history');
    cy.contains('Cancel Order').should('not.exist');
  });

  it('should cancel order when confirming cancellation', () => {
    const mockOrder = {
      orders: [
        {
          id: 1,
          listing_name: 'Test Item',
          seller_name: 'Test Seller',
          price: 50.00,
          status: 'pending',
          created_at: '2026-04-11T15:30:00Z'
        }
      ]
    };
    
    cy.intercept('GET', '/api/orders', { statusCode: 200, body: mockOrder });
    cy.intercept('PUT', '/api/orders/1/cancel', { statusCode: 200, body: { success: true } });
    
    cy.visit('http://localhost:4200/order-history');
    cy.contains('Cancel Order').click();
    cy.on('window:confirm', () => true);
    
    cy.intercept('GET', '/api/orders', { statusCode: 200, body: { orders: [] } });
  });

  it('should delete order when confirming deletion', () => {
    const mockOrder = {
      orders: [
        {
          id: 1,
          listing_name: 'Test Item',
          seller_name: 'Test Seller',
          price: 50.00,
          status: 'completed',
          created_at: '2026-04-10T10:00:00Z'
        }
      ]
    };
    
    cy.intercept('GET', '/api/orders', { statusCode: 200, body: mockOrder });
    cy.intercept('DELETE', '/api/orders/1', { statusCode: 200, body: { success: true } });
    
    cy.visit('http://localhost:4200/order-history');
    cy.contains('Delete from History').click();
    cy.on('window:confirm', () => true);
    
    cy.intercept('GET', '/api/orders', { statusCode: 200, body: { orders: [] } });
  });

  it('should display error message on load failure', () => {
    cy.intercept('GET', '/api/orders', { statusCode: 500, body: { error: 'Server error' } });
    
    cy.visit('http://localhost:4200/order-history');
    cy.get('.error-message').should('be.visible');
  });

  it('should format dates correctly', () => {
    const mockOrder = {
      orders: [
        {
          id: 1,
          listing_name: 'Test Item',
          seller_name: 'Test Seller',
          price: 50.00,
          status: 'completed',
          created_at: '2026-04-10T10:00:00Z'
        }
      ]
    };
    
    cy.intercept('GET', '/api/orders', { statusCode: 200, body: mockOrder });
    
    cy.visit('http://localhost:4200/order-history');
    // Date should be formatted as "Apr 10, 2026"
    cy.contains('Apr 10, 2026').should('be.visible');
  });
});
