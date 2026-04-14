import { Component, Input, signal, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe, NgIf } from '@angular/common';

import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';

export interface Listing {
  id: string;
  image_count: number;
  first_image_id: string | null;
  title: string;
  description: string;
  price: number;
  seller_name: string;
  seller_id: string;
}

export interface ListingRequest {
  key: string;
  query: string;
  limit: number;
  cursor: string;
}

@Component({
  selector: 'app-listing',
  imports: [MatIconModule, CurrencyPipe, NgIf],
  templateUrl: './listing.html',
  styleUrl: './listing.css',
})
export class Listing {
  @Input({ required: true }) listing!: Listing;
  @Output() purchased = new EventEmitter<string>();

  purchasing = signal(false);
  purchaseSuccess = signal(false);
  purchaseError = signal('');

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
  ) {}

  /** Returns true when a user is logged in. */
  get canBuy(): boolean {
    return !!this.authService.currentUser();
  }

  async buy(event: MouseEvent) {
    // Prevent card-level click propagation if any.
    event.stopPropagation();

    if (this.purchasing()) return;

    if (!confirm(`Purchase "${this.listing.title}" for ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.listing.price)}?`)) {
      return;
    }

    this.purchasing.set(true);
    this.purchaseError.set('');
    this.purchaseSuccess.set(false);

    try {
      await this.orderService.createOrder(this.listing.id);
      this.purchaseSuccess.set(true);
      // Emit event so parent can remove item from list
      this.purchased.emit(this.listing.id);
      // Auto-clear success message after 4 s.
      setTimeout(() => this.purchaseSuccess.set(false), 4000);
    } catch (e: unknown) {
      this.purchaseError.set(e instanceof Error ? e.message : 'Purchase failed.');
      setTimeout(() => this.purchaseError.set(''), 4000);
    } finally {
      this.purchasing.set(false);
    }
  }

  timeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}

