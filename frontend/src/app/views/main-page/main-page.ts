import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-main-page',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
  ],
  templateUrl: './main-page.html',
  styleUrl: './main-page.css',
})
export class MainPage {
  searchQuery = '';

  // Mock product data — replace with real API data later
  products: Product[] = [
    {
      id: 1,
      name: 'Calculus Textbook',
      description: 'MAC 2311 – Lightly used, no highlights',
      price: 45,
      image: 'https://placehold.co/300x200?text=Textbook',
    },
    {
      id: 2,
      name: 'Desk Lamp',
      description: 'LED desk lamp, adjustable brightness',
      price: 15,
      image: 'https://placehold.co/300x200?text=Lamp',
    },
    {
      id: 3,
      name: 'TI-84 Calculator',
      description: 'Works perfectly, includes batteries',
      price: 60,
      image: 'https://placehold.co/300x200?text=Calculator',
    },
    {
      id: 4,
      name: 'Mini Fridge',
      description: 'Compact 1.7 cu ft, great for dorms',
      price: 50,
      image: 'https://placehold.co/300x200?text=Fridge',
    },
    {
      id: 5,
      name: 'Bike Lock',
      description: 'Heavy-duty U-lock with keys',
      price: 20,
      image: 'https://placehold.co/300x200?text=Bike+Lock',
    },
    {
      id: 6,
      name: 'Noise-Cancelling Headphones',
      description: 'Sony WH-1000XM4, mint condition',
      price: 120,
      image: 'https://placehold.co/300x200?text=Headphones',
    },
  ];

  constructor(private router: Router) {}

  get filteredProducts(): Product[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.products;
    return this.products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    );
  }

  // Minimal client-side logout: POST to backend logout endpoint,
  // then clear local client state and navigate to login (via Router).
  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('logout request failed', e);
    }

    // Clear stored access token
    try {
      localStorage.removeItem('accessToken');
    } catch {}

    // Use Angular Router for navigation instead of window.location
    this.router.navigate(['/']);
  }
}
