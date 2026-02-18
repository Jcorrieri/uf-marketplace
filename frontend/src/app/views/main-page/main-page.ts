import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-page',
  imports: [],
  templateUrl: './main-page.html',
  styleUrl: './main-page.css',
})
export class MainPage {
  constructor(private router: Router) {}

  // Minimal client-side logout: POST to backend logout endpoint,
  // then clear local client state and navigate to login (via Router).
  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('logout request failed', e);
    }

    // Clear stored access token
    try { localStorage.removeItem('accessToken'); } catch {}

    // Use Angular Router for navigation instead of window.location
    this.router.navigate(['/']);
  }
}
