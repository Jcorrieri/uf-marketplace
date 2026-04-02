import { Injectable } from '@angular/core';

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private user: CurrentUser | null = null;

  async loadUser(): Promise<void> {
    try {
      const res = await fetch('/api/users/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        this.user = {
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email
        };
      }
    } catch {
      this.user = null;
    }
  }

  setUser(user: CurrentUser) {
    this.user = user;
  }

  getUser(): CurrentUser | null {
    return this.user;
  }

  clearUser() {
    this.user = null;
  }
}