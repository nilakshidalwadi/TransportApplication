import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayTruckserviceComponent } from './display-truckservice.component';

describe('DisplayTruckserviceComponent', () => {
  let component: DisplayTruckserviceComponent;
  let fixture: ComponentFixture<DisplayTruckserviceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DisplayTruckserviceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayTruckserviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
