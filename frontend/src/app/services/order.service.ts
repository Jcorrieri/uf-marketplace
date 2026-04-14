import { Injectable } from '@angular/core';

export interface Order {
  id: string;
  listing_id: string;
  listing_title: string;
  price: number;
  buyer_id: string;
  buyer_name: string;
  seller_id: string;
  seller_name: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  /**
   * Creates a new purchase order for the given listing.
   * The backend will validate the buyer is not the seller.
   */
  async createOrder(listingId: string): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to place order');
    }

    return res.json() as Promise<Order>;
  }

  /** Returns all orders where the current user is the buyer. */
  async getMyPurchases(): Promise<Order[]> {
    const res = await fetch('/api/orders/purchases', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load purchase history');
    return (await res.json()) as Order[];
  }

  /** Returns all orders where the current user is the seller. */
  async getMySales(): Promise<Order[]> {
    const res = await fetch('/api/orders/sales', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load sales history');
    return (await res.json()) as Order[];
  }
}
