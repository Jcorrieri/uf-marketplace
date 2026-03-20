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