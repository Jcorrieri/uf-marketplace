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
  private readonly storageKey = 'current_user';
  private user: CurrentUser | null = null;

  constructor() {
    // Load user from localStorage on startup
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      this.user = JSON.parse(stored);
    }
  }

  setUser(user: CurrentUser) {
    this.user = user;
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  getUser(): CurrentUser | null {
    return this.user;
  }

  clearUser() {
    this.user = null;
    localStorage.removeItem(this.storageKey);
  }
}