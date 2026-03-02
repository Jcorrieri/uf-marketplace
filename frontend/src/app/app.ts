import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  showNavbar = true;

  constructor(private router: Router) {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.showNavbar = !(e as NavigationEnd).urlAfterRedirects.startsWith('/main');
    });
  }
}
