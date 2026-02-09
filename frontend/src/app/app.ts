import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TextField } from './components/text-field/text-field';
import { LoginPage } from "./views/login-page/login-page";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoginPage],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('UfMarketPlace');

  apiResponse = signal('');

  
}
