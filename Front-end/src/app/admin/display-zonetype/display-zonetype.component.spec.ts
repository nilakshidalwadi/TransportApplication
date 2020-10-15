import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayZonetypeComponent } from './display-zonetype.component';

describe('DisplayZonetypeComponent', () => {
  let component: DisplayZonetypeComponent;
  let fixture: ComponentFixture<DisplayZonetypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DisplayZonetypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayZonetypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
