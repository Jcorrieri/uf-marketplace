import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe } from '@angular/common';

export interface Listing {
  id: string;
  seller_id: string;
  image_count: number;
  first_image_id: string | null;
  title: string;
  description: string;
  price: number;
  seller_name: string;
}

export interface ListingRequest {
  key: string;
  query: string;
  limit: number;
  cursor: string;
}

export const NULL_UUID = "00000000-0000-0000-0000-000000000000"

@Component({
  selector: 'app-listing',
  imports: [MatIconModule, CurrencyPipe],
  templateUrl: './listing.html',
  styleUrl: './listing.css',
})
export class Listing {
  @Input({ required: true }) listing!: Listing;

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
