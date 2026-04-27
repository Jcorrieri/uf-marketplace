import { Routes } from '@angular/router';
import { LoginPage } from './views/login-page/login-page';
import { SignUpPage } from './views/sign-up-page/sign-up-page';
import { MainPage } from './views/main-page/main-page';
import { UserProfilePage } from './views/user-profile-page/user-profile-page';
import { CreateListingPage } from './views/create-listing-page/create-listing-page';
import { MyListingsPage } from './views/my-listings-page/my-listings-page';
import { ProductDetailPage } from './views/product-detail-page/product-detail-page';
import { OrderHistoryPage } from './views/order-history-page/order-history-page';
import { ForgotPasswordPage } from './views/forgot-password-page/forgot-password-page';
import { ResetPasswordPage } from './views/reset-password-page/reset-password-page';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  { path: 'sign-up', component: SignUpPage },
  { path: 'forgot-password', component: ForgotPasswordPage },
  { path: 'reset-password', component: ResetPasswordPage },
  { path: 'main', component: MainPage, canActivate: [authGuard] },
  { path: 'product/:id', component: ProductDetailPage, canActivate: [authGuard] },
  { path: 'profile', component: UserProfilePage, canActivate: [authGuard] },
  { path: 'create-listing', component: CreateListingPage, canActivate: [authGuard] },
  { path: 'my-listings', component: MyListingsPage, canActivate: [authGuard] },
  { path: 'orders', component: OrderHistoryPage, canActivate: [authGuard] },
];
