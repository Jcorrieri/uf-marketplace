import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../services/order.service';

export interface PurchaseDialogData {
  listingId: number;
  listingName: string;
  price: number;
  sellerName: string;
}

@Component({
  selector: 'app-purchase-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="purchase-dialog">
      <h2 mat-dialog-title class="dialog-title">Confirm Purchase</h2>

      <mat-dialog-content>
        <div class="purchase-details">
          <mat-card class="item-card">
            <mat-card-content>
              <div class="detail-row">
                <span class="label">Item:</span>
                <span class="value">{{ data.listingName }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Seller:</span>
                <span class="value">{{ data.sellerName }}</span>
              </div>
              <div class="detail-row total">
                <span class="label">Total Price:</span>
                <span class="value">\${{ data.price.toFixed(2) }}</span>
              </div>
            </mat-card-content>
          </mat-card>

          <div class="confirmation-text">
            <mat-icon>info</mat-icon>
            <p>
              By clicking "Confirm Purchase", you agree to complete this transaction.
              This is a binding agreement.
            </p>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()" [disabled]="processing()">
          Cancel
        </button>
        <button
          mat-raised-button
          color="primary"
          (click)="onConfirm()"
          [disabled]="processing()"
        >
          <ng-container>
            @if (processing()) {
              <mat-spinner diameter="20"></mat-spinner>
              <span>Processing...</span>
            } @else {
              <mat-icon iconPositionEnd>check_circle</mat-icon>
              <span>Confirm Purchase</span>
            }
          </ng-container>
        </button>
      </mat-dialog-actions>

      @if (errorMsg()) {
        <div class="error-message">
          <mat-icon>error</mat-icon>
          <p>{{ errorMsg() }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .purchase-dialog {
      min-width: 400px;
    }

    .dialog-title {
      margin: 0;
      padding: 0;
      font-size: 20px;
      font-weight: 600;
    }

    mat-dialog-content {
      padding: 24px 0;
    }

    .purchase-details {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .item-card {
      border: 1px solid #e0e0e0;

      mat-card-content {
        padding: 16px;
      }
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;

      &.total {
        border-bottom: none;
        font-weight: 600;
        font-size: 16px;
        padding-top: 16px;

        .value {
          color: #2e7d32;
        }
      }

      .label {
        color: #666;
        font-weight: 500;
      }

      .value {
        color: #333;
      }
    }

    .confirmation-text {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 4px;

      mat-icon {
        margin-top: 4px;
        color: #1976d2;
        flex-shrink: 0;
      }

      p {
        margin: 0;
        font-size: 14px;
        color: #666;
      }
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      gap: 8px;

      button {
        button {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
      padding: 12px;
      background-color: #ffebee;
      border-left: 4px solid #f44336;
      border-radius: 4px;
      color: #c62828;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      p {
        margin: 0;
        font-size: 14px;
      }
    }
  `],
})
export class PurchaseDialogComponent {
  processing = signal(false);
  errorMsg = signal('');

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PurchaseDialogData,
    private dialogRef: MatDialogRef<PurchaseDialogComponent>,
    private orderService: OrderService
  ) {}

  onCancel() {
    this.dialogRef.close();
  }

  async onConfirm() {
    try {
      this.processing.set(true);
      this.errorMsg.set('');

      const order = await this.orderService.createOrder(this.data.listingId);
      this.dialogRef.close(order);
    } catch (error) {
      this.errorMsg.set(
        error instanceof Error ? error.message : 'Failed to complete purchase'
      );
    } finally {
      this.processing.set(false);
    }
  }
}
