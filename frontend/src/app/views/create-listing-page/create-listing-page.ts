import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

interface ImagePreview {
  file: File;
  url: string;
}

@Component({
  selector: 'app-create-listing-page',
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './create-listing-page.html',
  styleUrl: './create-listing-page.css',
})
export class CreateListingPage {
  title = '';
  description = '';
  price: number | null = null;
  images: ImagePreview[] = [];
  submitting = signal(false);
  errorMsg = signal('');

  constructor(private router: Router) {}

  onImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        this.errorMsg.set('Only JPEG and PNG images are allowed.');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.errorMsg.set('Each image must be under 5MB.');
        continue;
      }
      const url = URL.createObjectURL(file);
      this.images.push({ file, url });
    }
    // Reset the input so re-selecting the same file works
    input.value = '';
  }

  removeImage(index: number) {
    URL.revokeObjectURL(this.images[index].url);
    this.images.splice(index, 1);
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  async submitListing() {
    if (!this.title.trim()) {
      this.errorMsg.set('Title is required.');
      return;
    }
    if (!this.description.trim()) {
      this.errorMsg.set('Description is required.');
      return;
    }
    if (this.price === null || this.price < 0) {
      this.errorMsg.set('Please enter a valid price.');
      return;
    }

    this.submitting.set(true);
    this.errorMsg.set('');

    try {
      const formData = new FormData();
      formData.append('title', this.title.trim());
      formData.append('description', this.description.trim());
      formData.append('price', String(this.price));

      for (const img of this.images) {
        formData.append('images', img.file);
      }

      const res = await fetch('/api/listings', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        this.errorMsg.set(body.error || 'Failed to create listing.');
        return;
      }

      this.router.navigate(['/main']);
    } catch {
      this.errorMsg.set('Unable to reach the server.');
    } finally {
      this.submitting.set(false);
    }
  }
}
