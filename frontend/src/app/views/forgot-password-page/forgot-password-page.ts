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
  submitted = signal(false);
  errorMsg = signal('');

  constructor(private router: Router) {}

  async submit() {
    if (this.emailControl.invalid) {
      this.emailControl.markAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMsg.set('');

    // Backend does not yet expose a password-reset endpoint. We simulate the
    // request so the UX is complete; when the backend ships POST
    // /api/auth/forgot-password, swap this block for a real fetch call.
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      this.submitted.set(true);
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
