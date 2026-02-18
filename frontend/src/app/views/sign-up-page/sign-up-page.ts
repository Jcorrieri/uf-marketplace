import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-sign-up-page',
  imports: [RouterLink],
  templateUrl: './sign-up-page.html',
  styleUrl: './sign-up-page.css',
})
export class SignUpPage {
  private router = inject(Router);

  firstName = signal('');
  lastName = signal('');
  username = signal('');
  email = signal('');
  password = signal('');
  showPassword = signal(false);
  errorMessage = signal('');

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
    this.errorMessage.set('');

    const body = {
      username: this.username(),
      email: this.email(),
      password: this.password(),
      first_name: this.firstName(),
      last_name: this.lastName(),
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        try {
          const errorBody = await response.json();
          this.errorMessage.set(errorBody.error || `Registration failed (status ${response.status}).`);
        } catch {
          this.errorMessage.set(`Server returned an error (status ${response.status}).`);
        }
        return;
      }

      await response.json();
      this.router.navigate(['/main']);
    } catch (err) {
      this.errorMessage.set('Unable to reach the server. Make sure the backend is running and try again.');
    }
  }
}
