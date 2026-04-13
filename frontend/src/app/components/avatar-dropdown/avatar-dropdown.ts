import { Component, ElementRef, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-avatar-dropdown',
  imports: [MatIconModule],
  templateUrl: './avatar-dropdown.html',
  styleUrl: './avatar-dropdown.css',
})
export class AvatarDropdown {
  constructor(
    private authService: AuthService,
    private router: Router,
    private elRef: ElementRef,
  ) {}

  menuOpen = false;

  // Close menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.menuOpen = false;
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  get currentUser() {
    return this.authService.currentUser() ?? { firstName: '?', lastName: '?' };
  }

  get initials(): string {
    return (this.currentUser.firstName[0] + this.currentUser.lastName[0]).toUpperCase();
  }

  get profileImageUrl(): string | null {
    const id =
      this.currentUser && 'image_id' in this.currentUser ? this.currentUser.image_id : null;
    return id ? `/api/images/${id}` : null;
  }

  async logout() {
    this.menuOpen = false;
    await this.authService.logout();
    this.router.navigate(['/']);
  }

  navigateTo(path: string) {
    this.menuOpen = false;
    this.router.navigate([path]);
  }
}
