import { Component, HostListener, OnInit, ChangeDetectorRef} from '@angular/core';
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

  products: Product[] = [];
  filteredProducts: Product[] = [];

  showAddModal = false;
  newListing: { title: string; description: string; price: number | null; image_url: string } = 
  { title: '', description: '', price: null, image_url: '' };

  uploadedFileName = '';


  async ngOnInit() {
    try {
      await this.authService.loadUser();
    } catch {
      // user load failed, continue anyway
    }

    this.http.get<Product[]>('/api/listings')
      .subscribe({
        next: data => {
          this.products = data;
          this.filteredProducts = data;
          this.cdr.detectChanges();
        },
        error: err => {
          console.error('Failed to load listings:', err);
        }
      });
  }
  // search functionality
  onSearch() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredProducts = this.products;
      return;
    }
    this.filteredProducts = this.products.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  }

openAddModal() {
  this.showAddModal = true;
}

closeAddModal() {
  this.showAddModal = false;
  this.newListing = { title: '', description: '', price: null, image_url: ''};
  this.uploadedFileName = '';
}

addListing() {
  const { title, description, price, image_url } = this.newListing;
  if (!title.trim() || !description.trim() || price === null || !image_url.trim()) {
    alert('Please fill in all fields before posting.');
    return;
  }
  this.http.post<Product>('/api/listings', this.newListing, { withCredentials: true })
    .subscribe({
      next: (_) => {  
        this.closeAddModal();                                      
        this.http.get<Product[]>('/api/listings').subscribe({  
          next: data => {
            this.products = data ?? [];
            this.filteredProducts = data ?? [];
            this.cdr.detectChanges();
          },
        });
      },
      error: (err) => {
        console.error('Failed to create listing:', err);
      }
    });
}

onFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  this.uploadedFileName = file.name;
  const reader = new FileReader();
  reader.onload = () => {
    this.newListing.image_url = reader.result as string;
    this.cdr.detectChanges();
  };
  reader.readAsDataURL(file);
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
