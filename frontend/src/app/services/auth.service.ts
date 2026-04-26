import { Injectable } from '@angular/core';

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  image_id?: string | null;
  createdAt?: string; 
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
          email: data.email,
          image_id: data.image_id,
          createdAt: data.created_at, 
        };
      }
    } catch {
      this.user = null;
    }
  }

  setUser(user: CurrentUser) {
    this.user = user;
  }

  currentUser(): CurrentUser | null {
    return this.user;
  }

  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('logout request failed', e);
    }
    this.user = null;
  }
}
