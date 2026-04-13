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
  template: `
    <div class="order-history-container">
      <h2 class="page-title">Order History</h2>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>Loading your orders...</p>
        </div>
      } @else if (errorMsg()) {
        <div class="error-message">
          <mat-icon>error</mat-icon>
          <p>{{ errorMsg() }}</p>
        </div>
      } @else if (orders().length === 0) {
        <div class="empty-state">
          <mat-icon>shopping_cart</mat-icon>
          <p>No orders yet</p>
          <p class="hint">Items you purchase will appear here</p>
        </div>
      } @else {
        <div class="orders-list">
          @for (order of orders(); track order.id) {
            <mat-card class="order-card">
              <mat-card-header>
                <div class="order-id-section">
                  <span class="order-id">Order #{{ order.id }}</span>
                  <span [ngClass]="'status-badge status-' + order.status">
                    {{ order.status | titlecase }}
                  </span>
                </div>
                <div class="order-date">
                  {{ formatDate(order.created_at) }}
                </div>
              </mat-card-header>

              <mat-card-content>
                <div class="order-detail-row">
                  <span class="label">Item:</span>
                  <span class="value">{{ order.listing_name }}</span>
                </div>
                <div class="order-detail-row">
                  <span class="label">Seller:</span>
                  <span class="value">{{ order.seller_name }}</span>
                </div>
                <div class="order-detail-row">
                  <span class="label">Price:</span>
                  <span class="value">\${{ order.price.toFixed(2) }}</span>
                </div>
              </mat-card-content>

              <mat-card-actions>
                @if (order.status === 'pending') {
                  <button
                    mat-raised-button
                    color="warn"
                    (click)="cancelOrder(order.id)"
                  >
                    <mat-icon>close</mat-icon>
                    Cancel Order
                  </button>
                }
                <button mat-button>
                  <mat-icon>info</mat-icon>
                  Details
                </button>
                <button
                  mat-button
                  color="warn"
                  (click)="deleteOrder(order.id)"
                >
                  <mat-icon>delete</mat-icon>
                  Delete from History
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .order-history-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .page-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 24px;
      color: #333;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 16px;
      color: #666;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background-color: #ffebee;
      border-left: 4px solid #f44336;
      border-radius: 4px;
      color: #c62828;
    }

    .error-message mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 16px;
      color: #999;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        opacity: 0.5;
      }

      p {
        margin: 0;
      }

      .hint {
        font-size: 14px;
        color: #ccc;
      }
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .order-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;

      mat-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 16px;
        border-bottom: 1px solid #f5f5f5;

        .order-id-section {
          display: flex;
          align-items: center;
          gap: 12px;

          .order-id {
            font-weight: 600;
            font-size: 16px;
          }

          .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;

            &.status-completed {
              background-color: #e8f5e9;
              color: #2e7d32;
            }

            &.status-pending {
              background-color: #fff3e0;
              color: #e65100;
            }

            &.status-cancelled {
              background-color: #ffebee;
              color: #c62828;
            }
          }
        }

        .order-date {
          font-size: 14px;
          color: #999;
        }
      }

      mat-card-content {
        padding: 16px;

        .order-detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;

          .label {
            font-weight: 500;
            color: #666;
          }

          .value {
            color: #333;
          }
        }
      }

      mat-card-actions {
        padding: 12px 16px;
        display: flex;
        gap: 8px;

        button {
          button {
            mat-icon {
              margin-right: 4px;
            }
          }
        }
      }
    }
  `],
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
