import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Represents a purchased listing recorded on the client.
 *
 * NOTE: This service stores orders in `localStorage` because the backend
 * does not yet expose a purchase / order-history endpoint. When the backend
 * team adds one, the internal storage here can be swapped for real API
 * calls without changing the page that consumes this service.
 */
export interface OrderRecord {
  order_id: string;
  listing_id: string;
  title: string;
  description: string;
  price: number;
  first_image_id: string | null;
  seller_name: string;
  /** ISO 8601 timestamp captured at the moment of purchase (client-side). */
  purchased_at: string;
  /** Placeholder until backend supports real fulfillment states. */
  status: 'Completed' | 'Processing' | 'Shipped';
}

export interface PurchaseInput {
  listing_id: string;
  title: string;
  description: string;
  price: number;
  first_image_id: string | null;
  seller_name: string;
}

const STORAGE_PREFIX = 'uf-marketplace.orders.';
const GUEST_KEY = 'guest';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private authService: AuthService) {}

  /** Returns all orders for the currently signed-in user, newest first. */
  getOrders(): OrderRecord[] {
    const raw = this.readRaw();
    return [...raw].sort(
      (a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime(),
    );
  }

  /** Records a new order for the current user and returns it. */
  recordPurchase(input: PurchaseInput): OrderRecord {
    const order: OrderRecord = {
      order_id: this.generateId(),
      listing_id: input.listing_id,
      title: input.title,
      description: input.description,
      price: input.price,
      first_image_id: input.first_image_id,
      seller_name: input.seller_name,
      purchased_at: new Date().toISOString(),
      status: 'Processing',
    };

    const existing = this.readRaw();
    existing.push(order);
    this.writeRaw(existing);
    return order;
  }

  private readRaw(): OrderRecord[] {
    try {
      const raw = localStorage.getItem(this.storageKey());
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as OrderRecord[]) : [];
    } catch {
      return [];
    }
  }

  private writeRaw(orders: OrderRecord[]): void {
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(orders));
    } catch {
      // Storage may be unavailable (private mode, quota). Silently ignore.
    }
  }

  private storageKey(): string {
    const user = this.authService.currentUser();
    return STORAGE_PREFIX + (user?.id ?? GUEST_KEY);
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return 'ord_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}
