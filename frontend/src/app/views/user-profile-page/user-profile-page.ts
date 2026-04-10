import { Component, OnInit, signal, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService, CurrentUser } from '../../services/auth.service';

@Component({
  selector: 'app-user-profile-page',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './user-profile-page.html',
  styleUrl: './user-profile-page.css',
})
export class UserProfilePage implements OnInit {
  @ViewChild('profileImageInput') profileImageInput!: ElementRef<HTMLInputElement>;

  user: CurrentUser | null = null;
  saving = signal(false);
  errorMsg = signal('');
  profileImageUrl: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadUser();
  }

  private async loadUser() {
    try {
      const res = await fetch('/api/users/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const u: CurrentUser = {
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          image_id: data.image_id,
        };
        this.authService.setUser(u);
        this.user = u;
        if (data.image_id) {
          this.profileImageUrl = `/api/images/${data.image_id}?t=${Date.now()}`;
        }
        this.cdr.detectChanges();
      }
    } catch {
      this.user = this.authService.getUser();
      this.cdr.detectChanges();
    }
  }

  get initials(): string {
    if (!this.user) return '?';
    return ((this.user.firstName?.[0] ?? '') + (this.user.lastName?.[0] ?? '')).toUpperCase();
  }

  onAvatarClick() {
    this.profileImageInput.nativeElement.click();
  }

  async onProfileImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.errorMsg.set('Only JPEG and PNG images are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.errorMsg.set('Image must be under 5MB.');
      return;
    }

    this.saving.set(true);
    this.errorMsg.set('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/users/me/profile-image', {
          method: 'PUT',
          credentials: 'include',
          body: formData,
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
          this.errorMsg.set(body.error || 'Failed to upload image.');
          return;
      }

      // Refresh the image
      if (this.user) {
          this.user.image_id = body.image_id;
          this.profileImageUrl = `/api/images/${this.user.image_id}?t=${Date.now()}`;
      }

    } catch {
      this.errorMsg.set('Unable to reach the server.');
    } finally {
      this.saving.set(false);
      this.cdr.detectChanges();
    }
  }

  goBack() {
    this.router.navigate(['/main']);
  }

  goToCreateListing() {
    this.router.navigate(['/create-listing']);
  }

  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('logout request failed', e);
    }
    this.authService.clearUser();
    this.router.navigate(['/']);
  }
}
