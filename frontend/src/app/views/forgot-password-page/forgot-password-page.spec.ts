import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ForgotPasswordPage } from './forgot-password-page';

describe('ForgotPasswordPage', () => {
  let component: ForgotPasswordPage;
  let fixture: ComponentFixture<ForgotPasswordPage>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should mark email as required by default', () => {
    expect(component.emailControl.valid).toBe(false);
    expect(component.emailControl.hasError('required')).toBe(true);
  });

  it('should reject malformed email values', () => {
    component.emailControl.setValue('not-an-email');
    expect(component.emailControl.hasError('email')).toBe(true);
  });

  it('should accept a well-formed email', () => {
    component.emailControl.setValue('user@ufl.edu');
    expect(component.emailControl.valid).toBe(true);
  });

  it('should mark the email as touched and not call fetch when invalid form is submitted', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch');
    component.emailControl.setValue('');

    await component.submit();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(component.emailControl.touched).toBe(true);
  });

  it('should navigate to /reset-password with token on successful response', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ reset_token: 'tok-123' }), { status: 200 }),
    );
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.emailControl.setValue('user@ufl.edu');
    await component.submit();

    expect(navSpy).toHaveBeenCalledWith(['/reset-password'], {
      queryParams: { token: 'tok-123' },
    });
    expect(component.submitting()).toBe(false);
    expect(component.errorMsg()).toBe('');
  });

  it('should show "no account" message when response has no token', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'ok' }), { status: 200 }),
    );

    component.emailControl.setValue('unknown@ufl.edu');
    await component.submit();

    expect(component.errorMsg()).toBe('No account found for that email.');
    expect(component.submitting()).toBe(false);
  });

  it('should show server error message when response is not ok', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid input' }), { status: 400 }),
    );

    component.emailControl.setValue('user@ufl.edu');
    await component.submit();

    expect(component.errorMsg()).toBe('invalid input');
  });

  it('should show generic error on network failure', async () => {
    vi.spyOn(window, 'fetch').mockRejectedValue(new Error('network down'));

    component.emailControl.setValue('user@ufl.edu');
    await component.submit();

    expect(component.errorMsg()).toBe('Something went wrong. Please try again.');
    expect(component.submitting()).toBe(false);
  });

  it('goToLogin should navigate to /login', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.goToLogin();
    expect(navSpy).toHaveBeenCalledWith(['/login']);
  });
});
