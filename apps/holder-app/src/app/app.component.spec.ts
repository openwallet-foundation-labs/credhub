import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { CheckForUpdatesService } from './check-for-updates.service';
import { SwUpdate } from '@angular/service-worker';
import { of } from 'rxjs';
import { SettingsService } from '@my-wallet/holder-shared';
import { HttpClientModule } from '@angular/common/http';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let checkForUpdatesService: CheckForUpdatesService;
  let settingsService: SettingsService;

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn(() => {
        return {
          matches: true,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        };
      }),
    });
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppComponent, HttpClientModule],
      providers: [
        CheckForUpdatesService,
        { provide: SwUpdate, useValue: { available: of() } }, // Mock SwUpdate
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    checkForUpdatesService = TestBed.inject(CheckForUpdatesService);
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have CheckForUpdatesService injected', () => {
    expect(checkForUpdatesService).toBeTruthy();
  });
});
