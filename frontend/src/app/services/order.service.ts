import { Injectable } from '@angular/core';

export interface Order {
  id: number;
  listing_id: number;
  listing_name: string;
  price: number;
  seller_name: string;
  buyer_name: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private baseUrl = '/api/orders';

  async createOrder(listingId: number): Promise<Order> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ listing_id: listingId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create order');
    }

    return response.json();
  }

  async getBuyerOrderHistory(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ orders: Order[]; count: number }> {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());

    const response = await fetch(`${this.baseUrl}/buyer/me?${params.toString()}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order history');
    }

    return response.json();
  }

  async getSellerOrderHistory(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ orders: Order[]; count: number }> {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());

    const response = await fetch(`${this.baseUrl}/seller/me?${params.toString()}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sales history');
    }

    return response.json();
  }

  async getOrder(orderId: number): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/${orderId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }

    return response.json();
  }

  async cancelOrder(orderId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${orderId}/cancel`, {
      method: 'PUT',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel order');
    }
  }

  async deleteOrder(orderId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${orderId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete order');
    }
  }
}
