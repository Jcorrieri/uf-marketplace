import { describe, it, expect, vi, type Mock } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { OrderHistoryPage } from './order-history-page';
import { AuthService } from '../../services/auth.service';
import { OrderRecord, OrderService } from '../../services/order.service';

type AuthServiceMock = { loadUser: Mock; currentUser: Mock; logout: Mock };
type OrderServiceMock = { getOrders: Mock };

function makeAuthMock(loadUser: Mock = vi.fn().mockResolvedValue(undefined)): AuthServiceMock {
  return {
    loadUser,
    currentUser: vi.fn().mockReturnValue(null),
    logout: vi.fn().mockResolvedValue(undefined),
  };
}

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    order_id: 'order-1234abcd',
    listing_id: 'listing-1',
    title: 'Used Textbook',
    description: 'Calculus 2 textbook, good condition.',
    price: 25,
    first_image_id: 'img-1',
    seller_name: 'Albert Gator',
    purchased_at: '2026-01-15T10:00:00.000Z',
    status: 'Completed',
    ...overrides,
  };
}

describe('OrderHistoryPage', () => {
  let fixture: ComponentFixture<OrderHistoryPage>;
  let component: OrderHistoryPage;
  let router: Router;
  let authServiceMock: AuthServiceMock;
  let orderServiceMock: OrderServiceMock;

  async function setup(orders: OrderRecord[] | Error = []) {
    authServiceMock = makeAuthMock();
    orderServiceMock = {
      getOrders:
        orders instanceof Error
          ? vi.fn().mockRejectedValue(orders)
          : vi.fn().mockResolvedValue(orders),
    };

    await TestBed.configureTestingModule({
      imports: [OrderHistoryPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: OrderService, useValue: orderServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderHistoryPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  // ---------- Creation ----------

  it('should create the order history page', async () => {
    await setup([]);
    expect(component).toBeTruthy();
  });

  // ---------- ngOnInit / data loading ----------

  it('should load user and orders on init', async () => {
    const orders = [makeOrder()];
    await setup(orders);

    expect(authServiceMock.loadUser).toHaveBeenCalled();
    expect(orderServiceMock.getOrders).toHaveBeenCalled();
    expect(component.orders()).toEqual(orders);
    expect(component.loading()).toBe(false);
  });

  it('should still render with empty orders when getOrders fails', async () => {
    await setup(new Error('network down'));

    expect(component.orders()).toEqual([]);
    expect(component.loading()).toBe(false);
  });

  it('should still load orders when loadUser rejects', async () => {
    authServiceMock = makeAuthMock(vi.fn().mockRejectedValue(new Error('no user')));
    orderServiceMock = { getOrders: vi.fn().mockResolvedValue([makeOrder()]) };

    await TestBed.configureTestingModule({
      imports: [OrderHistoryPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: OrderService, useValue: orderServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderHistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.orders().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  // ---------- totalSpent ----------

  it('should compute totalSpent as 0 when there are no orders', async () => {
    await setup([]);
    expect(component.totalSpent).toBe(0);
  });

  it('should sum prices for totalSpent across orders', async () => {
    await setup([
      makeOrder({ order_id: 'o1', price: 10 }),
      makeOrder({ order_id: 'o2', price: 25.5 }),
      makeOrder({ order_id: 'o3', price: 4.5 }),
    ]);

    expect(component.totalSpent).toBe(40);
  });

  // ---------- Rendering ----------

  it('should render the empty state when there are no orders', async () => {
    await setup([]);
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('.empty-state')).toBeTruthy();
    expect(host.textContent).toContain('No orders yet');
    expect(host.querySelector('.order-list')).toBeNull();
    expect(host.querySelector('.summary-card')).toBeNull();
  });

  it('should render an order card and the summary card when orders exist', async () => {
    await setup([makeOrder({ price: 30 }), makeOrder({ order_id: 'order-2', price: 70 })]);
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('.empty-state')).toBeNull();
    expect(host.querySelectorAll('.order-card').length).toBe(2);
    expect(host.querySelector('.summary-card')).toBeTruthy();
    expect(host.textContent).toContain('Used Textbook');
    expect(host.textContent).toContain('Albert Gator');
  });

  it('should render an image when first_image_id is set, and a placeholder otherwise', async () => {
    await setup([
      makeOrder({ order_id: 'o1', first_image_id: 'img-1' }),
      makeOrder({ order_id: 'o2', first_image_id: null }),
    ]);
    const host: HTMLElement = fixture.nativeElement;

    const img = host.querySelector('img.order-image') as HTMLImageElement | null;
    expect(img).toBeTruthy();
    expect(img!.src).toContain('/api/images/img-1');
    expect(host.querySelector('.order-image-placeholder')).toBeTruthy();
  });

  // ---------- Navigation ----------

  it('should navigate to /main when goBack() is called', async () => {
    await setup([]);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.goBack();

    expect(navSpy).toHaveBeenCalledWith(['/main']);
  });

  it('should navigate to the product detail page with listing state when viewListing() is called', async () => {
    await setup([]);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const order = makeOrder({ listing_id: 'listing-42', first_image_id: 'img-7' });

    component.viewListing(order);

    expect(navSpy).toHaveBeenCalledWith(
      ['/product', 'listing-42'],
      expect.objectContaining({
        state: expect.objectContaining({
          listing: expect.objectContaining({
            id: 'listing-42',
            title: order.title,
            price: order.price,
            first_image_id: 'img-7',
            image_count: 1,
            seller_name: order.seller_name,
          }),
        }),
      }),
    );
  });

  it('should set image_count to 0 in viewListing state when there is no image', async () => {
    await setup([]);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const order = makeOrder({ first_image_id: null });

    component.viewListing(order);

    const args = navSpy.mock.calls[navSpy.mock.calls.length - 1] as [
      unknown[],
      { state: { listing: { image_count: number } } },
    ];
    expect(args[1].state.listing.image_count).toBe(0);
  });
});
