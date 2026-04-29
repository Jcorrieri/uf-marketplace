import { Component, OnInit, signal, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
    DatePipe,
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


  editingName = signal(false);
  editFirstName = '';
  editLastName = '';
  saveError = signal('');

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
          createdAt: data.created_at,
        };
        this.authService.setUser(u);
        this.user = u;
        if (data.image_id) {
          this.profileImageUrl = `/api/images/${data.image_id}?t=${Date.now()}`;
        }
        this.cdr.detectChanges();
      }
    } catch {
      this.user = this.authService.currentUser();
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
        this.authService.setUser(this.user);
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

  startEditName() {
    this.editFirstName = this.user?.firstName ?? '';
    this.editLastName = this.user?.lastName ?? '';
    this.saveError.set('');
    this.editingName.set(true);
  }

  cancelEdit() {
    this.editingName.set(false);
    this.saveError.set('');
  }

  async saveProfile() {
    if (!this.editFirstName.trim() || !this.editLastName.trim()) {
      this.saveError.set('First and last name are required.');
      return;
    }

    this.saving.set(true);
    this.saveError.set('');

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: this.editFirstName.trim(),
          last_name: this.editLastName.trim(),
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        this.saveError.set(body.error || 'Failed to save changes.');
        return;
      }

      if (this.user) {
        this.user.firstName = body.first_name;
        this.user.lastName = body.last_name;
        this.authService.setUser(this.user);
      }

      this.editingName.set(false);
    } catch {
      this.saveError.set('Unable to reach the server.');
    } finally {
      this.saving.set(false);
      this.cdr.detectChanges();
    }
  }

  goToCreateListing() {
    this.router.navigate(['/create-listing']);
  }

  goToChangePassword() {
    this.router.navigate(['/forgot-password']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
