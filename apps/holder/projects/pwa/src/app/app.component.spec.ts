import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { CheckForUpdatesService } from './check-for-updates.service';
import { SwUpdate } from '@angular/service-worker';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let checkForUpdatesService: CheckForUpdatesService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppComponent],
      providers: [
        CheckForUpdatesService,
        { provide: SwUpdate, useValue: { available: of() } }, // Mock SwUpdate
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    checkForUpdatesService = TestBed.inject(CheckForUpdatesService);
  }));

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have CheckForUpdatesService injected', () => {
    expect(checkForUpdatesService).toBeTruthy();
  });
});
