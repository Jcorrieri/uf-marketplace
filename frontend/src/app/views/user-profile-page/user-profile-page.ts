import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-profile-page',
  imports: [CommonModule, MatIconModule],
  templateUrl: './user-profile-page.html',
  styleUrl: './user-profile-page.css',
})
export class UserProfilePage {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/main']);
  }

  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('logout request failed', e);
    }
    this.router.navigate(['/']);
  }
}
