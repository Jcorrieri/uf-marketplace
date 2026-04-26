import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

type Theme = 'light' | 'dark' | 'system';

@Component({
  selector: 'app-settings-page',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage implements OnInit {
  theme = signal<Theme>('system');
  notifyMessages = signal(true);
  notifyListings = signal(true);
  deleting = signal(false);
  deleteError = signal('');

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    // Restore saved preferences
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) this.theme.set(savedTheme);

    const savedMessages = localStorage.getItem('notifyMessages');
    if (savedMessages !== null) this.notifyMessages.set(savedMessages === 'true');

    const savedListings = localStorage.getItem('notifyListings');
    if (savedListings !== null) this.notifyListings.set(savedListings === 'true');

    this.applyTheme(this.theme());
  }

  setTheme(t: Theme) {
    this.theme.set(t);
    localStorage.setItem('theme', t);
    this.applyTheme(t);
  }

  private applyTheme(t: Theme) {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');
    if (t === 'light') body.classList.add('theme-light');
    if (t === 'dark') body.classList.add('theme-dark');
  }

  toggleMessages() {
    const next = !this.notifyMessages();
    this.notifyMessages.set(next);
    localStorage.setItem('notifyMessages', String(next));
  }

  toggleListings() {
    const next = !this.notifyListings();
    this.notifyListings.set(next);
    localStorage.setItem('notifyListings', String(next));
  }

  async deleteAccount() {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This cannot be undone.',
    );
    if (!confirmed) return;

    this.deleting.set(true);
    this.deleteError.set('');

    try {
      const res = await fetch('/api/users/me', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        this.deleteError.set('Failed to delete account. Please try again.');
        return;
      }

      this.authService.logout();
      this.router.navigate(['/']);
    } catch {
      this.deleteError.set('Unable to reach the server.');
    } finally {
      this.deleting.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/main']);
  }
}