import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TextField } from './components/text-field/text-field';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TextField],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('UfMarketPlace');

  apiResponse = signal('');

  ngOnInit(): void {
    fetch('/api/hello-world')
      .then(response => response.json())
      .then(data => {
        this.apiResponse.set(data.content);
      })
      .catch(error => {
        console.error('API error:', error);
        this.apiResponse.set('Error fetching from backend');
      });
  }
}
