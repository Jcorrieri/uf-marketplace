import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignUpPage } from './signup-page';

describe('SignUpPage', () => {
  let component: SignUpPage;
  let fixture: ComponentFixture<SignUpPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignUpPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignUpPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
