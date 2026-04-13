import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyListingsPage } from './my-listings-page';

describe('MyListingsPage', () => {
  let component: MyListingsPage;
  let fixture: ComponentFixture<MyListingsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyListingsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyListingsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
