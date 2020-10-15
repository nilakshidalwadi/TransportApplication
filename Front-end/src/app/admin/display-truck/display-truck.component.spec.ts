import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayTruckComponent } from './display-truck.component';

describe('DisplayTruckComponent', () => {
  let component: DisplayTruckComponent;
  let fixture: ComponentFixture<DisplayTruckComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DisplayTruckComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayTruckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
