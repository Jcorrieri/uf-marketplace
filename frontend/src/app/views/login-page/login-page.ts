import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  userName = signal('');
  password = signal('');
  showPassword = signal(false);

  constructor(private router: Router) {}

  onEmailInput(event: Event) {
    this.userName.set((event.target as HTMLInputElement).value);
  }

  onPasswordInput(event: Event) {
    this.password.set((event.target as HTMLInputElement).value);
  }

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  // Perform login request, store access token, and navigate on success.
  async login() {
    const email = this.userName();
    const password = this.password();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('login failed', data);
        // Optionally show UI error
        return;
      }

      if (data.access_token) {
        localStorage.setItem('accessToken', data.access_token);
        // Navigate to main page
        this.router.navigate(['/main']);
      } else {
        console.error('no access_token in response', data);
      }
    } catch (err) {
      console.error('network error during login', err);
    }
  }
}
