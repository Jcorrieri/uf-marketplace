import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { Product } from '../main-page/main-page'; // reuse the existing interface

@Component({
  selector: 'app-my-listings-page',
  imports: [CommonModule, MatIconModule],
  templateUrl: './my-listings-page.html',
  styleUrl: './my-listings-page.css',
})
export class MyListingsPage implements OnInit {
  listings: Product[] = [];

  get currentUser() {
    return this.authService.getUser() ?? { firstName: '?', lastName: '?' };
  }

  get initials(): string {
    return (
      this.currentUser.firstName[0] + this.currentUser.lastName[0]
    ).toUpperCase();
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    try {
      await this.authService.loadUser();
    } catch {}

    this.http.get<Product[]>('/api/listings/mine').subscribe({
      next: data => {
        this.listings = data ?? [];
        this.cdr.detectChanges();
      },
      error: err => console.error('Failed to load my listings:', err)
    });
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}