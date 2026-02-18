import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoginButton } from '../../components/login-button/login-button';

@Component({
  selector: 'app-login-page',
  imports: [LoginButton, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  userName = signal('');
  password = signal('');
  showPassword = signal(false);

  onEmailInput(event: Event) {
    this.userName.set((event.target as HTMLInputElement).value);
  }

  onPasswordInput(event: Event) {
    this.password.set((event.target as HTMLInputElement).value);
  }

  togglePassword() {
    this.showPassword.update((v) => !v);
  }
}
