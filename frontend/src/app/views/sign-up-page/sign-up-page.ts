import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AbstractControl, ValidationErrors, FormGroupDirective } from '@angular/forms';

// Angular Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sign-up-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule, // Changed from FormsModule to match login page pattern
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './sign-up-page.html',
  styleUrl: './sign-up-page.css',
})
export class SignUpPage {
  private router = inject(Router);
  matcher = {
    isErrorState: (control: FormControl, form: FormGroupDirective): boolean => {
      return !!(form?.hasError('passwordMismatch') && control.dirty);
    }
  };

  showPassword = signal(false);
  errorMessage = signal('');

  // Define form group with validators to control button state
  signUpForm = new FormGroup(
    {
      firstName: new FormControl('', [Validators.required]),
      lastName: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    {
      validators: (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password');
      const confirmPassword = control.get('confirmPassword');

      if (!password || !confirmPassword || !confirmPassword.value) return null;

      return password.value === confirmPassword.value
        ? null
        : { passwordMismatch: true };
      }
    }
  );

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  async onSignUp() {
    if (this.signUpForm.invalid) return;

    this.errorMessage.set('');
    const formValue = this.signUpForm.value;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formValue.email,
          password: formValue.password,
          first_name: formValue.firstName,
          last_name: formValue.lastName,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        this.errorMessage.set(errorBody.error || `Error: ${response.status}`);
        return;
      }

      // NOTE: Set navigation to login page after successful sign-up for auth testing
      this.router.navigate(['/login']);
      // this.router.navigate(['/main']);
    } catch (err) {
      this.errorMessage.set('Unable to reach the server.');
    }
  }
}
