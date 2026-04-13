import { Routes } from '@angular/router';
import { LoginPage } from './views/login-page/login-page';
import { SignUpPage } from './views/sign-up-page/sign-up-page';
import { MainPage } from './views/main-page/main-page';
import { UserProfilePage } from './views/user-profile-page/user-profile-page';
import { CreateListingPage } from './views/create-listing-page/create-listing-page';
import { authGuard } from './guards/auth.guard';
import { MyListingsPage } from './views/my-listings-page/my-listings-page';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  { path: 'sign-up', component: SignUpPage },
  { path: 'main', component: MainPage, canActivate: [authGuard] },
  { path: 'profile', component: UserProfilePage, canActivate: [authGuard] },
  { path: 'create-listing', component: CreateListingPage, canActivate: [authGuard] },
  { path: 'my-listings', component: MyListingsPage, canActivate: [authGuard] },
];
