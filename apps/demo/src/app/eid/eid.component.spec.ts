import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EidComponent } from './eid.component';

describe('EidComponent', () => {
  let component: EidComponent;
  let fixture: ComponentFixture<EidComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EidComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
