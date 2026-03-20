import { Routes } from '@angular/router';
import { LoginPage } from './views/login-page/login-page';
import { SignUpPage } from './views/sign-up-page/sign-up-page';
import { MainPage } from './views/main-page/main-page';
import { ForgotPasswordPage } from './views/forgot-password-page/forgot-password-page';
import { ResetPasswordPage } from './views/reset-password-page/reset-password-page';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  { path: 'sign-up', component: SignUpPage },
  { path: 'forgot-password', component: ForgotPasswordPage },
  { path: 'reset-password', component: ResetPasswordPage },
  { path: 'main', component: MainPage },
];
