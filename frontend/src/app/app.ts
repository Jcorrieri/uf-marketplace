import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { ChatWidget } from './components/chat-widget/chat-widget';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatWidget],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private authRoutes = ['/login', '/sign-up', '/'];

  constructor(private router: Router) {}

  ngOnInit() {
    // Apply theme on every route change
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.applyTheme(e.urlAfterRedirects);
      });

    // Apply on initial load
    this.applyTheme(window.location.pathname);

    // Keep in sync if OS theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      this.applyTheme(this.router.url);
    });
  }

  private applyTheme(url: string) {
    const saved = (localStorage.getItem('theme') as 'light' | 'dark' | 'system') ?? 'system';
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');

    // Never apply dark theme on auth pages
    const isAuthPage = this.authRoutes.some(r => url === r || url.startsWith(r + '?'));
    if (isAuthPage) {
      body.classList.add('theme-light');
      return;
    }

    if (saved === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      body.classList.add(saved === 'dark' ? 'theme-dark' : 'theme-light');
    }
  }
}