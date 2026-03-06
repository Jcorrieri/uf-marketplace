import { Routes } from '@angular/router';
import { LoginPage } from './views/login-page/login-page';
import { SignUpPage } from './views/sign-up-page/sign-up-page';
import { MainPage } from './views/main-page/main-page';
import { UserProfilePage } from './views/user-profile-page/user-profile-page';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  { path: 'sign-up', component: SignUpPage },
  { path: 'main', component: MainPage },
  { path: 'profile', component: UserProfilePage },
];
