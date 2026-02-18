import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sign-up-page',
  imports: [RouterLink],
  templateUrl: './sign-up-page.html',
  styleUrl: './sign-up-page.css',
})
export class SignUpPage {
  firstName = signal('');
  lastName = signal('');
  username = signal('');
  email = signal('');
  password = signal('');
  showPassword = signal(false);

  onFirstNameInput(event: Event) {
    this.firstName.set((event.target as HTMLInputElement).value);
  }

  onLastNameInput(event: Event) {
    this.lastName.set((event.target as HTMLInputElement).value);
  }

  onUsernameInput(event: Event) {
    this.username.set((event.target as HTMLInputElement).value);
  }

  onEmailInput(event: Event) {
    this.email.set((event.target as HTMLInputElement).value);
  }

  onPasswordInput(event: Event) {
    this.password.set((event.target as HTMLInputElement).value);
  }

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  //Call the backend code to create the user in backend database. upon successful completion of this function, the front end takes the user to the Main Page
  async onSignUp() {
    const body = {
      username: this.username(),
      email: this.email(),
      password: this.password(),
      first_name: this.firstName(),
      last_name: this.lastName(),
    };

    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Registration failed:', error);
        return;
      }

      const data = await response.json();
      console.log('Registration successful:', data);
    } catch (err) {
      console.error('Network error:', err);
    }
  }
}
