import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssuanceRequestComponent } from './issuance-request.component';

describe('IssuanceRequestComponent', () => {
  let component: IssuanceRequestComponent;
  let fixture: ComponentFixture<IssuanceRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssuanceRequestComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IssuanceRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
