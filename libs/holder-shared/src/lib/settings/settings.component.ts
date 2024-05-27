import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SettingsService } from './settings.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatListModule } from '@angular/material/list';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SettingsApiService } from '../api';

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace globalThis {
  let environment: {
    backendUrl: string;
    keycloakHost: string;
    keycloakClient: string;
    keycloakRealm: string;
    demoIssuer: string;
    demoVerifier: string;
  };
}

export abstract class AuthServiceInterface {
  abstract logout(): void;
}

@Component({
  selector: 'lib-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  imports: [
    MatButtonModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    MatListModule,
  ],
  // providers: [provideHttpClient()],
})
export class SettingsComponent implements OnInit {
  automateControl!: FormControl<boolean | null>;
  keycloakLink: string;

  constructor(
    public authService: AuthServiceInterface,
    public settingsService: SettingsService,
    private httpClient: HttpClient,
    private settingsApiService: SettingsApiService
  ) {
    this.automateControl = new FormControl();
    this.keycloakLink = `${globalThis.environment.keycloakHost}/realms/${globalThis.environment.keycloakRealm}/account`;
  }

  async ngOnInit(): Promise<void> {
    const settings = await firstValueFrom(
      this.settingsApiService.settingsControllerGetSettings()
    );
    this.automateControl.setValue(settings.auto);
    this.automateControl.valueChanges.subscribe(async (value) => {
      await firstValueFrom(
        this.settingsApiService.settingsControllerSetSettings({
          auto: value as boolean,
        })
      );
    });
  }

  async showLicense() {
    const licencse = await firstValueFrom(
      this.httpClient.get('/3rdpartylicenses.txt', { responseType: 'text' })
    );
    alert(licencse);
  }
}
