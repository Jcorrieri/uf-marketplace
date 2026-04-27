import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-forgot-password-page',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './forgot-password-page.html',
  styleUrl: './forgot-password-page.css',
})
export class ForgotPasswordPage {
  emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  submitting = signal(false);
  errorMsg = signal('');

  constructor(private router: Router) {}

  async submit() {
    if (this.emailControl.invalid) {
      this.emailControl.markAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMsg.set('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.emailControl.value }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        this.errorMsg.set(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      if (typeof data.reset_token === 'string') {
        this.router.navigate(['/reset-password'], { queryParams: { token: data.reset_token } });
        return;
      }

      this.errorMsg.set('No account found for that email.');
    } catch {
      this.errorMsg.set('Something went wrong. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
