import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvatarDropdown } from './avatar-dropdown';

describe('AvatarDropdown', () => {
  let component: AvatarDropdown;
  let fixture: ComponentFixture<AvatarDropdown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarDropdown]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvatarDropdown);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
