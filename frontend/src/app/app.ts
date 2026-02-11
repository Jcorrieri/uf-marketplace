import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { LoginPage } from './views/login-page/login-page';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, LoginPage],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
