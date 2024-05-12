import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { IssuerService } from './issuer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  const mockIssuerService = {
    getUrl: jest.fn().mockReturnValue(of('')),
    uri: 'test-uri',
  };

  const mockSnackBar = {
    open: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [
        { provide: IssuerService, useValue: mockIssuerService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate QR code', async () => {
    await component.generate();
    expect(mockIssuerService.getUrl).toHaveBeenCalled();
    expect(component.qrCodeField.value).toBe('test-uri');
  });

  it('should copy value to clipboard', () => {
    component.copyValue();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'URL copied to clipboard',
      'Close',
      { duration: 3000 }
    );
  });
});
