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
  templateUrl: './purchase-dialog.component.html',
  styleUrl: './purchase-dialog.component.css',
})
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
