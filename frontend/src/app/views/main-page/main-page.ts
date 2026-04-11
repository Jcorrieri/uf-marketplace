import { Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

// Our imports
import { AuthService } from '../../services/auth.service';
import { AvatarDropdown } from '../../avatar-dropdown/avatar-dropdown';
import { Listing, ListingRequest } from '../../listing/listing';

@Component({
  selector: 'app-main-page',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    AvatarDropdown,
    Listing,
  ],
  templateUrl: './main-page.html',
  styleUrl: './main-page.css',
})
export class MainPage implements OnInit {
  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit() {
    try {
      await this.authService.loadUser();
    } catch {
      // user load failed, continue anyway
    }

    const results = await this.fetchListings(this.listingRequest);

    this.listings = results;
  }

  searchQuery = '';

  // Shared by OnInit and Search
  async fetchListings(request: ListingRequest) {
    const results = await firstValueFrom(
      this.http.get<Listing[]>('/api/listings', {
        params: {
          key: request.key,
          query: request.query,
          limit: request.limit,
          cursor: request.cursor
        }
      })
    );

    this.filteredListings = results;
    this.cdr.detectChanges();
    request.cursor = results[results.length - 1].id;

    return results;
  }

  listings: Listing[] = [];
  filteredListings: Listing[] = [];
  listingRequest: ListingRequest = {
    key: '',
    query: '',
    limit: 20,
    cursor: 0
  };

  // search functionality
  async search() {
    const query = this.searchQuery.toLowerCase().trim();
    const key = "title"; // Hardcoded for now but leaves flexibility for later

    const request = this.listingRequest
    request.key = key;
    request.query = query;
    request.cursor = 0; // Reset cursor upon new search

    // TODO: Maybe remove caching and just query the API every time? Not that expensive.
    if (!query) {
      request.cursor = this.listings[this.listings.length - 1].id; // Use cached id for cursor here
      this.filteredListings = this.listings;
      return;
    }

    await this.fetchListings(request);
  }

  openAddModal() {
    this.router.navigate(['/create-listing']);
  }

}
