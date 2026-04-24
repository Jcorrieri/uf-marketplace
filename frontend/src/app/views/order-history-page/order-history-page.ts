import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AvatarDropdown } from '../../components/avatar-dropdown/avatar-dropdown';
import { AuthService } from '../../services/auth.service';
import { OrderRecord, OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-history-page',
  imports: [CommonModule, CurrencyPipe, DatePipe, MatIconModule, MatButtonModule, AvatarDropdown],
  templateUrl: './order-history-page.html',
  styleUrl: './order-history-page.css',
})
export class OrderHistoryPage implements OnInit {
  orders = signal<OrderRecord[]>([]);
  loading = signal(true);

  constructor(
    private router: Router,
    private authService: AuthService,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    try {
      await this.authService.loadUser();
    } catch {
      // allow page to render even if user fetch fails
    }

    try {
      const orders = await this.orderService.getOrders();
      this.orders.set(orders);
    } catch {
      this.orders.set([]);
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }

  get totalSpent(): number {
    return this.orders().reduce((sum, o) => sum + o.price, 0);
  }

  goBack() {
    this.router.navigate(['/main']);
  }

  viewListing(order: OrderRecord) {
    this.router.navigate(['/product', order.listing_id], {
      state: {
        listing: {
          id: order.listing_id,
          title: order.title,
          description: order.description,
          price: order.price,
          first_image_id: order.first_image_id,
          image_count: order.first_image_id ? 1 : 0,
          seller_name: order.seller_name,
        },
      },
    });
  }
}
