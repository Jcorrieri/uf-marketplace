import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { describe, it, expect, afterEach, vi } from 'vitest';

import { ResetPasswordPage } from './reset-password-page';

function makeRoute(token: string | null) {
  return {
    snapshot: {
      queryParamMap: convertToParamMap(token === null ? {} : { token }),
    },
  } as unknown as ActivatedRoute;
}

async function createComponent(token: string | null): Promise<ComponentFixture<ResetPasswordPage>> {
  await TestBed.configureTestingModule({
    imports: [ResetPasswordPage],
    providers: [provideRouter([]), { provide: ActivatedRoute, useValue: makeRoute(token) }],
  }).compileComponents();

  const fixture = TestBed.createComponent(ResetPasswordPage);
  await fixture.whenStable();
  return fixture;
}

describe('ResetPasswordPage', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('should create', async () => {
    const fixture = await createComponent('abc');
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should populate token from query params', async () => {
    const fixture = await createComponent('my-token');
    expect(fixture.componentInstance.token()).toBe('my-token');
    expect(fixture.componentInstance.errorMsg()).toBe('');
  });

  it('should show error when token query param is missing', async () => {
    const fixture = await createComponent(null);
    expect(fixture.componentInstance.token()).toBe('');
    expect(fixture.componentInstance.errorMsg()).toContain('Missing reset token');
  });

  it('should require a password and reject ones shorter than 6 characters', async () => {
    const fixture = await createComponent('tok');
    const c = fixture.componentInstance;

    expect(c.passwordControl.hasError('required')).toBe(true);
    c.passwordControl.setValue('abc');
    expect(c.passwordControl.hasError('minlength')).toBe(true);
    c.passwordControl.setValue('abcdef');
    expect(c.passwordControl.valid).toBe(true);
  });

  it('submit should refuse to call API when token is missing', async () => {
    const fixture = await createComponent(null);
    const fetchSpy = vi.spyOn(window, 'fetch');

    await fixture.componentInstance.submit();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.errorMsg()).toContain('Missing reset token');
  });

  it('submit should mark fields touched when form invalid', async () => {
    const fixture = await createComponent('tok');
    const c = fixture.componentInstance;
    const fetchSpy = vi.spyOn(window, 'fetch');

    await c.submit();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(c.passwordControl.touched).toBe(true);
    expect(c.confirmPasswordControl.touched).toBe(true);
  });

  it('submit should error when passwords do not match', async () => {
    const fixture = await createComponent('tok');
    const c = fixture.componentInstance;
    const fetchSpy = vi.spyOn(window, 'fetch');

    c.passwordControl.setValue('password1');
    c.confirmPasswordControl.setValue('password2');
    await c.submit();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(c.errorMsg()).toBe('Passwords do not match.');
  });

  it('submit should set submitted on success', async () => {
    const fixture = await createComponent('tok');
    const c = fixture.componentInstance;

    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'password reset successful' }), { status: 200 }),
    );

    c.passwordControl.setValue('password1');
    c.confirmPasswordControl.setValue('password1');
    await c.submit();

    expect(c.submitted()).toBe(true);
    expect(c.submitting()).toBe(false);
    expect(c.errorMsg()).toBe('');
  });

  it('submit should surface backend error message on non-OK response', async () => {
    const fixture = await createComponent('tok');
    const c = fixture.componentInstance;

    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid or expired reset token' }), { status: 400 }),
    );

    c.passwordControl.setValue('password1');
    c.confirmPasswordControl.setValue('password1');
    await c.submit();

    expect(c.submitted()).toBe(false);
    expect(c.errorMsg()).toBe('invalid or expired reset token');
  });

  it('submit should show network error when fetch throws', async () => {
    const fixture = await createComponent('tok');
    const c = fixture.componentInstance;

    vi.spyOn(window, 'fetch').mockRejectedValue(new Error('offline'));

    c.passwordControl.setValue('password1');
    c.confirmPasswordControl.setValue('password1');
    await c.submit();

    expect(c.errorMsg()).toBe('Network error. Please try again.');
    expect(c.submitting()).toBe(false);
  });

  it('goToLogin should navigate to /login', async () => {
    const fixture = await createComponent('tok');
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.goToLogin();

    expect(navSpy).toHaveBeenCalledWith(['/login']);
  });
});
