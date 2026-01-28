import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('UfMarketPlace');
  apiResponse = signal('');

  ngOnInit(): void {
    fetch('/api/hello-world')
      .then(response => response.json()) // or .json() if your API returns JSON
      .then(data => {
        this.apiResponse.set(data.content);
      })
      .catch(error => {
        console.error('API error:', error);
        this.apiResponse.set('error!!!!');
      });
  }
}
