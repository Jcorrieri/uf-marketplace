import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { AvatarDropdown } from '../../components/avatar-dropdown/avatar-dropdown';
import { Listing } from '../../components/listing/listing';

@Component({
  selector: 'app-product-detail-page',
  imports: [CommonModule, CurrencyPipe, MatIconModule, MatButtonModule, AvatarDropdown],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.css',
})
export class ProductDetailPage implements OnInit {
  listing: Listing | null = null;
  imageUrls: string[] = [];
  selectedImageIndex = 0;
  loading = true;
  error = false;

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
      // continue
    }

    // Read listing data passed via router state from main page
    const nav = this.router.getCurrentNavigation?.() ?? history.state;
    const state = nav?.listing ? nav : (history.state as { listing?: Listing });

    if (state?.listing) {
      this.listing = state.listing;

      // Build image URL from the listing's first_image_id
      if (this.listing!.first_image_id) {
        this.imageUrls = [`/api/images/${this.listing!.first_image_id}`];
      }
    } else {
      this.error = true;
    }

    this.loading = false;
    this.cdr.detectChanges();
  }

  selectImage(index: number) {
    this.selectedImageIndex = index;
  }

  goBack() {
    this.router.navigate(['/main']);
  }

  async purchase() {
    if (!this.listing) return;

    try {
      await this.orderService.recordPurchase({
        listing_id: this.listing.id,
      });
      this.router.navigate(['/orders']);
    } catch {
      // keep user on page if purchase fails
    }
  }
}
