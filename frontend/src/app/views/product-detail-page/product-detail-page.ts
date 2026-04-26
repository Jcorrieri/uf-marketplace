import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { AvatarDropdown } from '../../components/avatar-dropdown/avatar-dropdown';
import { Listing } from '../../components/listing/listing';
import { ChatService } from '../../services/chat.service';
import { ChatWidgetService } from '../../services/chat-widget.service';

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
    private chatService: ChatService,
    private chatWidgetService: ChatWidgetService,
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

  async messageSeller() {
  if (!this.listing) return;
  try {
    const convo = await this.chatService.startConversation(
      this.listing.id,
      this.listing.seller_id,
    );
    this.chatWidgetService.openChat(convo);
  } catch {
    console.error('Failed to start conversation');
  }
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
