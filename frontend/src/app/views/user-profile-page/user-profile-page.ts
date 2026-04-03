import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService, CurrentUser } from '../../services/auth.service';

@Component({
  selector: 'app-user-profile-page',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './user-profile-page.html',
  styleUrl: './user-profile-page.css',
})
export class UserProfilePage implements OnInit {
  user: CurrentUser | null = null;
  editingName = signal(false);
  editFirstName = '';
  editLastName = '';
  saving = signal(false);
  errorMsg = signal('');

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.loadUser();
  }

  private async loadUser() {
    try {
      const res = await fetch('/api/users/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const u: CurrentUser = {
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
        };
        this.authService.setUser(u);
        this.user = u;
      }
    } catch {
      // fall back to cached user
      this.user = this.authService.getUser();
    }
  }

  get initials(): string {
    if (!this.user) return '?';
    return ((this.user.firstName?.[0] ?? '') + (this.user.lastName?.[0] ?? '')).toUpperCase();
  }

  startEditName() {
    this.editFirstName = this.user?.firstName ?? '';
    this.editLastName = this.user?.lastName ?? '';
    this.errorMsg.set('');
    this.editingName.set(true);
  }

  cancelEditName() {
    this.editingName.set(false);
    this.errorMsg.set('');
  }

  async saveName() {
    if (!this.editFirstName.trim() || !this.editLastName.trim()) {
      this.errorMsg.set('First and last name are required.');
      return;
    }
    this.saving.set(true);
    this.errorMsg.set('');
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          first_name: this.editFirstName.trim(),
          last_name: this.editLastName.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        this.errorMsg.set(body.error || 'Failed to update name.');
        return;
      }
      const data = await res.json();
      const updated: CurrentUser = {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
      };
      this.authService.setUser(updated);
      this.user = updated;
      this.editingName.set(false);
    } catch {
      this.errorMsg.set('Unable to reach the server.');
    } finally {
      this.saving.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/main']);
  }

  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('logout request failed', e);
    }
    this.authService.clearUser();
    this.router.navigate(['/']);
  }
}
