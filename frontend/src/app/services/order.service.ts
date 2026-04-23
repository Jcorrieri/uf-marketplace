import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  /** Returns all orders for the currently signed-in user, newest first. */
  async getOrders(): Promise<OrderRecord[]> {
    const request$ = this.http.get<OrderRecord[]>('/api/orders/me', {
      withCredentials: true,
    });
    return await firstValueFrom(request$);
  }

  /** Records a new order for the current user and returns it. */
  async recordPurchase(input: PurchaseInput): Promise<OrderRecord> {
    const request$ = this.http.post<OrderRecord>('/api/orders', input, {
      withCredentials: true,
    });
    return await firstValueFrom(request$);
  }
}
