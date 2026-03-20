import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    RouterLink,
  ],
  templateUrl: './forgot-password-page.html',
  styleUrl: './forgot-password-page.css',
})
export class ForgotPasswordPage {
  emailControl = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  ufIdControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  verifyForm = new FormGroup({
    email: this.emailControl,
    ufId: this.ufIdControl,
  });

  errorMessage = signal('');
  isSubmitting = signal(false);

  constructor(private router: Router) {}

  async verifyAccount() {
    if (this.verifyForm.invalid || this.isSubmitting()) {
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.emailControl.value,
          uf_id: this.ufIdControl.value,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 404) {
          this.router.navigate(['/login']);
          return;
        }

        this.errorMessage.set(data.error || 'Unable to verify account');
        return;
      }

      this.router.navigate(['/reset-password'], {
        queryParams: {
          email: this.emailControl.value,
          ufId: this.ufIdControl.value,
        },
      });
    } catch (err) {
      this.errorMessage.set('Unable to reach the server.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
