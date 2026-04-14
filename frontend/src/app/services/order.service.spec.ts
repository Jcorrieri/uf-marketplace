import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OrderService, Order } from './order.service';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const mockOrder: Order = {
        id: 1,
        listing_id: 123,
        listing_name: 'Test Item',
        price: 99.99,
        seller_name: 'John Seller',
        buyer_name: 'Jane Buyer',
        status: 'completed',
        created_at: '2026-04-12T12:00:00Z',
        updated_at: '2026-04-12T12:00:00Z',
      };

      vi.spyOn(window, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockOrder), { status: 200 })
      );

      const result = await service.createOrder(123);
      expect(result).toEqual(mockOrder);
    });

    it('should throw error on failed order creation', async () => {
      vi.spyOn(window, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Invalid listing' }), { status: 400 })
      );

      expect(service.createOrder(999)).rejects.toThrow('Invalid listing');
    });
  });

  describe('getBuyerOrderHistory', () => {
    it('should fetch buyer order history', async () => {
      const mockResponse = {
        orders: [
          {
            id: 1,
            listing_id: 123,
            listing_name: 'Item 1',
            price: 50.00,
            seller_name: 'Seller 1',
            buyer_name: 'Buyer 1',
            status: 'completed' as const,
            created_at: '2026-04-12T12:00:00Z',
            updated_at: '2026-04-12T12:00:00Z',
          },
        ],
        count: 1,
      };

      vi.spyOn(window, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await service.getBuyerOrderHistory();
      expect(result.orders.length).toBe(1);
      expect(result.count).toBe(1);
    });
  });

  describe('getSellerOrderHistory', () => {
    it('should fetch seller order history', async () => {
      const mockResponse = {
        orders: [
          {
            id: 2,
            listing_id: 456,
            listing_name: 'Item for Sale',
            price: 150.00,
            seller_name: 'Seller 2',
            buyer_name: 'Buyer 2',
            status: 'pending' as const,
            created_at: '2026-04-12T12:00:00Z',
            updated_at: '2026-04-12T12:00:00Z',
          },
        ],
        count: 1,
      };

      vi.spyOn(window, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await service.getSellerOrderHistory();
      expect(result.orders.length).toBe(1);
    });
  });

  describe('getOrder', () => {
    it('should fetch a single order by ID', async () => {
      const mockOrder: Order = {
        id: 1,
        listing_id: 123,
        listing_name: 'Test Item',
        price: 99.99,
        seller_name: 'John Seller',
        buyer_name: 'Jane Buyer',
        status: 'completed',
        created_at: '2026-04-12T12:00:00Z',
        updated_at: '2026-04-12T12:00:00Z',
      };

      vi.spyOn(window, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockOrder), { status: 200 })
      );

      const result = await service.getOrder(1);
      expect(result.id).toBe(1);
      expect(result.listing_name).toBe('Test Item');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order successfully', async () => {
      vi.spyOn(window, 'fetch').mockResolvedValueOnce(
        new Response('', { status: 200 })
      );

      await service.cancelOrder(1);
      expect(window.fetch).toHaveBeenCalled();
    });
  });

  describe('deleteOrder', () => {
    it('should delete an order successfully', async () => {
      vi.spyOn(window, 'fetch').mockResolvedValueOnce(
        new Response('', { status: 200 })
      );

      await service.deleteOrder(1);
      expect(window.fetch).toHaveBeenCalled();
    });
  });
});
