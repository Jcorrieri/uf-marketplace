import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderHistoryComponent } from './order-history.component';
import { OrderService, Order } from '../../services/order.service';

describe('OrderHistoryComponent', () => {
  let component: OrderHistoryComponent;
  let fixture: ComponentFixture<OrderHistoryComponent>;
  let orderService: Partial<OrderService>;

  const mockOrders: Order[] = [
    {
      id: 1,
      listing_id: 101,
      listing_name: 'Test Item 1',
      price: 99.99,
      seller_name: 'Seller One',
      buyer_name: 'Buyer One',
      status: 'completed',
      created_at: '2026-04-10T12:00:00Z',
      updated_at: '2026-04-10T12:00:00Z',
    },
    {
      id: 2,
      listing_id: 102,
      listing_name: 'Test Item 2',
      price: 49.99,
      seller_name: 'Seller Two',
      buyer_name: 'Buyer One',
      status: 'pending',
      created_at: '2026-04-12T12:00:00Z',
      updated_at: '2026-04-12T12:00:00Z',
    },
  ];

  beforeEach(async () => {
    orderService = {
      getBuyerOrderHistory: vi.fn().mockResolvedValue({ orders: mockOrders, count: 2 }),
      cancelOrder: vi.fn().mockResolvedValue(undefined),
      deleteOrder: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [OrderHistoryComponent],
      providers: [{ provide: OrderService, useValue: orderService }],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderHistoryComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with loading state true', () => {
      expect(component.loading()).toBe(true);
    });

    it('should initialize orders as empty array', () => {
      expect(component.orders()).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should load orders on component initialization', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.orders().length).toBe(2);
      expect(component.loading()).toBe(false);
    });

    it('should handle error during orders loading', async () => {
      const errorMsg = 'Failed to load';
      (orderService.getBuyerOrderHistory as any).mockRejectedValueOnce(new Error(errorMsg));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.errorMsg()).toBe(errorMsg);
      expect(component.loading()).toBe(false);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order when user confirms', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

      await component.cancelOrder(1);

      expect(orderService.cancelOrder).toHaveBeenCalledWith(1);
    });

    it('should not cancel when user declines', async () => {
      vi.spyOn(window, 'confirm').mockReturnValueOnce(false);

      await component.cancelOrder(1);

      expect(orderService.cancelOrder).not.toHaveBeenCalled();
    });
  });

 describe('deleteOrder', () => {
    it('should delete order when user confirms', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      vi.spyOn(window, 'confirm').mockReturnValueOnce(true);

      await component.deleteOrder(1);

      expect(orderService.deleteOrder).toHaveBeenCalledWith(1);
    });

    it('should not delete when user declines', async () => {
      vi.spyOn(window, 'confirm').mockReturnValueOnce(false);

      await component.deleteOrder(1);

      expect(orderService.deleteOrder).not.toHaveBeenCalled();
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const dateString = '2026-04-12T12:00:00Z';
      const formattedDate = component.formatDate(dateString);

      expect(formattedDate).toContain('Apr');
      expect(formattedDate).toContain('12');
      expect(formattedDate).toContain('2026');
    });
  });
});
