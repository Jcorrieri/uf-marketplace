import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { OrderService, Order } from '../../services/order.service';

@Component({
  selector: 'app-order-history-page',
  imports: [CommonModule, CurrencyPipe, DatePipe, MatIconModule, MatButtonModule],
  templateUrl: './order-history-page.html',
  styleUrl: './order-history-page.css',
})
export class OrderHistoryPage implements OnInit {
  activeTab: 'purchases' | 'sales' = 'purchases';

  purchases: Order[] = [];
  sales: Order[] = [];

  loading = signal(true);
  errorMsg = signal('');

  constructor(
    private router: Router,
    private orderService: OrderService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    await this.loadAll();
  }

  async loadAll() {
    this.loading.set(true);
    this.errorMsg.set('');
    try {
      const [purchases, sales] = await Promise.all([
        this.orderService.getMyPurchases(),
        this.orderService.getMySales(),
      ]);
      this.purchases = purchases;
      this.sales = sales;
    } catch (e: unknown) {
      this.errorMsg.set(e instanceof Error ? e.message : 'Failed to load order history.');
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }

  setTab(tab: 'purchases' | 'sales') {
    this.activeTab = tab;
  }

  get activeOrders(): Order[] {
    return this.activeTab === 'purchases' ? this.purchases : this.sales;
  }

  goBack() {
    this.router.navigate(['/main']);
  }
}
