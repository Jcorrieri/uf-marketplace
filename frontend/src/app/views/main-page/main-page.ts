import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface Product {
  id: number;
  image: string;
  title: string;
  description: string;
  price: number;
  seller: string;
  postedAt: Date;
}

@Component({
  selector: 'app-main-page',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './main-page.html',
  styleUrl: './main-page.css',
})
export class MainPage {
  searchQuery = '';

  products: Product[] = [
    {
      id: 1,
      image: 'https://picsum.photos/seed/desk/400/300',
      title: 'Standing Desk',
      description: 'Adjustable standing desk, great condition. Perfect for studying.',
      price: 85,
      seller: 'gator_jane',
      postedAt: new Date('2026-03-03T14:30:00'),
    },
    {
      id: 2,
      image: 'https://picsum.photos/seed/bike/400/300',
      title: 'Mountain Bike',
      description: 'Trek mountain bike, barely used. Includes lock and helmet.',
      price: 220,
      seller: 'swamp_mike',
      postedAt: new Date('2026-03-02T09:15:00'),
    },
    {
      id: 3,
      image: 'https://picsum.photos/seed/textbook/400/300',
      title: 'Organic Chemistry Textbook',
      description: '8th edition, no highlights. ISBN 978-0134042282.',
      price: 45,
      seller: 'study_sara',
      postedAt: new Date('2026-03-01T18:00:00'),
    },
    {
      id: 4,
      image: 'https://picsum.photos/seed/monitor/400/300',
      title: '27" Monitor',
      description: 'Dell 27" 1440p IPS monitor. Comes with HDMI cable.',
      price: 150,
      seller: 'tech_tommy',
      postedAt: new Date('2026-02-28T11:45:00'),
    },
    {
      id: 5,
      image: 'https://picsum.photos/seed/couch/400/300',
      title: 'Futon Couch',
      description: 'Foldable futon, dark grey. Great for dorm rooms.',
      price: 60,
      seller: 'dorm_dave',
      postedAt: new Date('2026-02-27T20:10:00'),
    },
    {
      id: 6,
      image: 'https://picsum.photos/seed/guitar/400/300',
      title: 'Acoustic Guitar',
      description: 'Yamaha FG800, excellent sound. Includes gig bag and tuner.',
      price: 130,
      seller: 'melody_maria',
      postedAt: new Date('2026-02-26T16:30:00'),
    },
    {
      id: 7,
      image: 'https://picsum.photos/seed/lamp/400/300',
      title: 'Desk Lamp',
      description: 'LED desk lamp with USB charging port. 3 brightness levels.',
      price: 18,
      seller: 'bright_ben',
      postedAt: new Date('2026-03-04T08:00:00'),
    },
    {
      id: 8,
      image: 'https://picsum.photos/seed/backpack/400/300',
      title: 'North Face Backpack',
      description: 'Black Borealis backpack, very spacious. Minor wear.',
      price: 40,
      seller: 'hiker_hanna',
      postedAt: new Date('2026-03-03T22:20:00'),
    },
  ];

  get filteredProducts(): Product[] {
  const query = this.searchQuery.toLowerCase().trim();
  if (!query) return this.products;
  return this.products.filter(p =>
    p.title.toLowerCase().includes(query) ||
    p.description.toLowerCase().includes(query) ||
    p.seller.toLowerCase().includes(query)
  );
}

  constructor(private router: Router) {}

  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('logout request failed', e);
    }

    // Use Angular Router for navigation instead of window.location
    this.router.navigate(['/']);
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
