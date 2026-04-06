import { Component, HostListener, OnInit, ChangeDetectorRef} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

export interface Product {
  id: number;
  image_url: string;
  title: string;
  description: string;
  price: number;
  seller_name: string;
}

export interface ProductRequest {
  key: string;
  query: string;
  limit: number;
  cursor: number;
}

@Component({
  selector: 'app-main-page',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './main-page.html',
  styleUrl: './main-page.css',
})
export class MainPage implements OnInit  {
  searchQuery = '';
  menuOpen = false;

  get currentUser() {
    return this.authService.getUser() ?? { firstName: '?', lastName: '?' };
  }

  get initials(): string {
    return (
      this.currentUser.firstName[0] + this.currentUser.lastName[0]
    ).toUpperCase();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  // Close menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.avatar-wrapper')) {
      this.menuOpen = false;
    }
  }

  // Shared by OnInit and Search
  async fetchListings(request: ProductRequest) {
    const results = await firstValueFrom(
      this.http.get<Product[]>('/api/listings', {
        params: {
          key: request.key,
          query: request.query,
          limit: request.limit,
          cursor: request.cursor
        }
      })
    );

    this.filteredProducts = results;
    this.cdr.detectChanges();
    request.cursor = results[results.length - 1].id;

    return results;
  }

  products: Product[] = [];
  filteredProducts: Product[] = [];
  productRequest: ProductRequest = {
    key: '',
    query: '',
    limit: 20,
    cursor: 0
  };

  async ngOnInit() {
    try {
      await this.authService.loadUser();
    } catch {
      // user load failed, continue anyway
    }

    const results = await this.fetchListings(this.productRequest);

    this.products = results;
  }

  // search functionality
  async search() {
    const query = this.searchQuery.toLowerCase().trim();
    const key = "title"; // Hardcoded for now but leaves flexibility for later

    const request = this.productRequest
    request.key = key;
    request.query = query;
    request.cursor = 0; // Reset cursor upon new search

    // TODO: Maybe remove caching and just query the API every time? Not that expensive.
    if (!query) {
      request.cursor = this.products[this.products.length - 1].id; // Use cached id for cursor here
      this.filteredProducts = this.products;
      return;
    }

    await this.fetchListings(request);
  }

  constructor(private router: Router, private authService: AuthService, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  navigateTo(path: string) {
    this.menuOpen = false;
    this.router.navigate([path]);
  }

  async logout() {
    this.menuOpen = false;
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('logout request failed', e);
    }
    this.authService.clearUser();
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
