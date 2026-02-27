import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    RouterLink
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  emailControl = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  passwordControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  loginForm = new FormGroup({
    email: this.emailControl,
    password: this.passwordControl,
  });

  showPassword = signal(false);

  constructor(private router: Router) {}

  togglePassword(event: MouseEvent) {
    this.showPassword.set(!this.showPassword());
    event.stopPropagation();
  }

  // Perform login request, store access token, and navigate on success.
  async login() {
    const email = this.emailControl.value;
    const password = this.passwordControl.value;

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
