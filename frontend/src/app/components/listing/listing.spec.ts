import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Listing } from './listing';

describe('Listing', () => {
  let component: Listing;
  let fixture: ComponentFixture<Listing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Listing]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Listing);
    component = fixture.componentInstance;
    component.listing = {
      id: 'l1',
      seller_id: 's1',
      image_count: 0,
      first_image_id: null,
      title: 'Test Listing',
      description: 'desc',
      price: 10,
      seller_name: 'Seller',
    } as any;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
