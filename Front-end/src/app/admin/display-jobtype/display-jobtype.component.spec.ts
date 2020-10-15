import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayJobtypeComponent } from './display-jobtype.component';

describe('DisplayJobtypeComponent', () => {
  let component: DisplayJobtypeComponent;
  let fixture: ComponentFixture<DisplayJobtypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DisplayJobtypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayJobtypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
