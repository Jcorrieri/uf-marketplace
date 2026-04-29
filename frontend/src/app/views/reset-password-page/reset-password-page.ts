import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reset-password-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.css',
})
export class ResetPasswordPage {
  passwordControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(6)],
  });

  confirmPasswordControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  token = signal('');
  submitting = signal(false);
  submitted = signal(false);
  errorMsg = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.token.set(token);

    if (!token) {
      this.errorMsg.set('Missing reset token. Request a new password reset link.');
    }
  }

  async submit() {
    if (!this.token()) {
      this.errorMsg.set('Missing reset token. Request a new password reset link.');
      return;
    }

    if (this.passwordControl.invalid || this.confirmPasswordControl.invalid) {
      this.passwordControl.markAsTouched();
      this.confirmPasswordControl.markAsTouched();
      return;
    }

    if (this.passwordControl.value !== this.confirmPasswordControl.value) {
      this.errorMsg.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);
    this.errorMsg.set('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: this.token(),
          new_password: this.passwordControl.value,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        this.errorMsg.set(data.error ?? 'Could not reset password.');
        return;
      }

      this.submitted.set(true);
    } catch {
      this.errorMsg.set('Network error. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
