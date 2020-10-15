import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoneTypeComponent } from './zone-type.component';

describe('ZoneTypeComponent', () => {
  let component: ZoneTypeComponent;
  let fixture: ComponentFixture<ZoneTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ZoneTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ZoneTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
