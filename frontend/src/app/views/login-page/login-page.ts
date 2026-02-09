import { Component, signal } from '@angular/core';

import { TextField } from '../../components/text-field/text-field';
import { RouterOutlet } from '@angular/router';
import { LoginButton } from "../../components/login-button/login-button";


//This is the main login page
//username and password are signals that hold the username and password strings, which this view will get form its child views, namely, app-text-field components
@Component({
  selector: 'app-login-page',
  imports: [RouterOutlet, TextField, LoginButton],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
    protected readonly title = signal('UfMarketPlace');
    userName = signal("")
    password = signal("")

    apiResponse = signal('');

  /* ngOnInit(): void {
    fetch('/api/hello-world')
      .then(response => response.json())
      .then(data => {
        this.apiResponse.set(data.content);
      })
      .catch(error => {
        console.error('API error:', error);
        this.apiResponse.set('Error fetching from backend');
      });
  } */
}
