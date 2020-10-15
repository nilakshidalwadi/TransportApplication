import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TruckServiceComponent } from './truck-service.component';

describe('TruckServiceComponent', () => {
  let component: TruckServiceComponent;
  let fixture: ComponentFixture<TruckServiceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TruckServiceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TruckServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
