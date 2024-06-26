import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TxCodeDialogComponent } from './tx-code-dialog.component';

describe('TxCodeDialogComponent', () => {
  let component: TxCodeDialogComponent;
  let fixture: ComponentFixture<TxCodeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TxCodeDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TxCodeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
