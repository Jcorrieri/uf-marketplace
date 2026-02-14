import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatButtonModule],
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
  togglePassword(event: MouseEvent) {
    this.showPassword.set(!this.showPassword());
    event.stopPropagation();
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    const payload = {
      email: this.emailControl.value,
      password: this.passwordControl.value,
    };
    // TODO: hook up authentication service
    console.log('Login submit', payload);
  }
}
