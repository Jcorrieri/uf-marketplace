import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PurchaseDialogComponent, PurchaseDialogData } from './purchase-dialog.component';
import { OrderService, Order } from '../../services/order.service';

describe('PurchaseDialogComponent', () => {
  let component: PurchaseDialogComponent;
  let fixture: ComponentFixture<PurchaseDialogComponent>;
  let orderService: Partial<OrderService>;
  let dialogRef: Partial<MatDialogRef<PurchaseDialogComponent>>;

  const mockDialogData: PurchaseDialogData = {
    listingId: 123,
    listingName: 'Test Item',
    price: 99.99,
    sellerName: 'John Seller',
  };

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

  beforeEach(async () => {
    orderService = {
      createOrder: vi.fn().mockResolvedValue(mockOrder),
    };

    dialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PurchaseDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: OrderService, useValue: orderService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseDialogComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should inject dialog data correctly', () => {
      expect(component.data).toEqual(mockDialogData);
    });

    it('should initialize processing state as false', () => {
      expect(component.processing()).toBe(false);
    });

    it('should initialize errorMsg as empty string', () => {
      expect(component.errorMsg()).toBe('');
    });
  });

  describe('onCancel', () => {
    it('should close dialog when cancel is clicked', () => {
      component.onCancel();
      expect(dialogRef.close).toHaveBeenCalled();
    });
  });

  describe('onConfirm', () => {
    it('should create order and close dialog on success', async () => {
      await component.onConfirm();

      expect(component.processing()).toBe(false);
      expect(orderService.createOrder).toHaveBeenCalledWith(123);
      expect(dialogRef.close).toHaveBeenCalledWith(mockOrder);
    });

    it('should set processing state during order creation', async () => {
      (orderService.createOrder as any).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve(mockOrder), 100))
      );

      const confirmPromise = component.onConfirm();
      expect(component.processing()).toBe(true);

      await confirmPromise;
      expect(component.processing()).toBe(false);
    });

    it('should display error message on failed order creation', async () => {
      const errorMsg = 'Insufficient balance';
      (orderService.createOrder as any).mockRejectedValueOnce(new Error(errorMsg));

      await component.onConfirm();

      expect(component.errorMsg()).toBe(errorMsg);
      expect(component.processing()).toBe(false);
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should handle generic error for non-Error object', async () => {
      (orderService.createOrder as any).mockRejectedValueOnce('Generic error');

      await component.onConfirm();

      expect(component.errorMsg()).toBe('Failed to complete purchase');
      expect(component.processing()).toBe(false);
    });

    it('should clear previous error message on new attempt', async () => {
      component.errorMsg.set('Previous error');

      await component.onConfirm();

      expect(component.errorMsg()).toBe('');
    });
  });

  describe('Template Rendering', () => {
    it('should display purchase details correctly', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Test Item');
      expect(compiled.textContent).toContain('John Seller');
      expect(compiled.textContent).toContain('99.99');
    });

    it('should display error message when present', () => {
      component.processing.set(false);
      component.errorMsg.set('Test error message');
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Test error message');
    });

    it('should not display error message when empty', () => {
      component.processing.set(false);
      component.errorMsg.set('');
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('.error-message');
      expect(errorElement).toBeFalsy();
    });

    it('should disable buttons when processing', () => {
      component.processing.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      buttons.forEach((button: HTMLButtonElement) => {
        expect(button.disabled).toBe(true);
      });
    });

    it('should enable buttons when not processing', () => {
      component.processing.set(false);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('button');
      buttons.forEach((button: HTMLButtonElement) => {
        expect(button.disabled).toBe(false);
      });
    });
  });

  describe('Price Formatting', () => {
    it('should format price with 2 decimal places', () => {
      const testData: PurchaseDialogData = {
        ...mockDialogData,
        price: 100.5,
      };

      component.data = testData;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('100.50');
    });

    it('should handle whole number price', () => {
      const testData: PurchaseDialogData = {
        ...mockDialogData,
        price: 100,
      };

      component.data = testData;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('100.00');
    });
  });
});
