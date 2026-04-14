import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService, Order } from '../../services/order.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.css',
})
export class OrderHistoryComponent implements OnInit {
  orders = signal<Order[]>([]);
  loading = signal(true);
  errorMsg = signal('');

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
  }

  private async loadOrders() {
    try {
      this.loading.set(true);
      this.errorMsg.set('');
      const result = await this.orderService.getBuyerOrderHistory();
      this.orders.set(result.orders);
    } catch (error) {
      this.errorMsg.set(
        error instanceof Error ? error.message : 'Failed to load orders'
      );
    } finally {
      this.loading.set(false);
    }
  }

  async cancelOrder(orderId: number) {
    if (
      !confirm(
        'Are you sure you want to cancel this order? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await this.orderService.cancelOrder(orderId);
      this.loadOrders();
    } catch (error) {
      this.errorMsg.set(
        error instanceof Error ? error.message : 'Failed to cancel order'
      );
    }
  }

  async deleteOrder(orderId: number) {
    if (
      !confirm(
        'Delete this order from your history? The listing will be restored to the marketplace.'
      )
    ) {
      return;
    }

    try {
      await this.orderService.deleteOrder(orderId);
      this.loadOrders();
    } catch (error) {
      this.errorMsg.set(
        error instanceof Error ? error.message : 'Failed to delete order'
      );
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
