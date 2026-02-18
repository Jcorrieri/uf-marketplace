import { Component } from '@angular/core';

@Component({
  selector: 'app-main-page',
  imports: [],
  templateUrl: './main-page.html',
  styleUrl: './main-page.css',
})
export class MainPage {
  // Minimal client-side logout: POST to backend logout endpoint,
  // then clear local client state and navigate to login.
  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      // ignore network errors; continue to clear client state
      console.error('logout request failed', e);
    }

    // Clear any client-side stored auth (adjust key if you use a different one)
    try { localStorage.removeItem('authToken'); } catch {}

    // Navigate to login page (adjust route as needed)
    window.location.href = '/';
  }
}
