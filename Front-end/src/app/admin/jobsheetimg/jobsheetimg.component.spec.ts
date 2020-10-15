import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JobsheetimgComponent } from './jobsheetimg.component';

describe('JobsheetimgComponent', () => {
  let component: JobsheetimgComponent;
  let fixture: ComponentFixture<JobsheetimgComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JobsheetimgComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobsheetimgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
