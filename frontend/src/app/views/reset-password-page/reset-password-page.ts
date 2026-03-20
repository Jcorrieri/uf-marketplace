import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-reset-password-page',
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
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.css',
})
export class ResetPasswordPage {
  email = '';
  ufId = '';

  showPassword = signal(false);
  errorMessage = signal('');
  isSubmitting = signal(false);

  resetForm = new FormGroup(
    {
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    {
      validators: (control: AbstractControl): ValidationErrors | null => {
        const password = control.get('password')?.value;
        const confirmPassword = control.get('confirmPassword')?.value;
        if (!password || !confirmPassword) {
          return null;
        }

        return password === confirmPassword ? null : { passwordMismatch: true };
      },
    }
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.ufId = this.route.snapshot.queryParamMap.get('ufId') ?? '';

    if (!this.email || !this.ufId) {
      this.router.navigate(['/forgot-password']);
    }
  }

  togglePassword() {
    this.showPassword.update((current) => !current);
  }

  async resetPassword() {
    if (this.resetForm.invalid || this.isSubmitting()) {
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email,
          uf_id: this.ufId,
          password: this.resetForm.controls.password.value,
          confirm_password: this.resetForm.controls.confirmPassword.value,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        this.errorMessage.set(data.error || 'Unable to reset password');
        return;
      }

      this.router.navigate(['/login']);
    } catch (err) {
      this.errorMessage.set('Unable to reach the server.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
