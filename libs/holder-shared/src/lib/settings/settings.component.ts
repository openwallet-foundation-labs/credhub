import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SettingsService } from './settings.service';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatListModule } from '@angular/material/list';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SettingsApiService } from '../api';

export abstract class AuthServiceInterface {
  abstract getSettingsLink(): string;
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
})
export class SettingsComponent implements OnInit {
  form!: FormGroup;
  keycloakLink: string;

  constructor(
    public authService: AuthServiceInterface,
    public settingsService: SettingsService,
    private httpClient: HttpClient,
    private settingsApiService: SettingsApiService
  ) {
    this.form = new FormGroup({
      auto: new FormControl(false),
      darkTheme: new FormControl(false),
    });
    this.keycloakLink = this.authService.getSettingsLink();
  }

  async ngOnInit(): Promise<void> {
    const settings = await firstValueFrom(
      this.settingsApiService.settingsControllerGetSettings()
    );
    this.form.setValue(settings);
    this.form.valueChanges.subscribe(async (value) => {
      await firstValueFrom(
        this.settingsApiService.settingsControllerSetSettings({
          auto: value.auto,
          darkTheme: value.darkTheme,
        })
      );
    });
    this.form.get('darkTheme')?.valueChanges.subscribe((value) => {
      if (value) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    });
  }

  async showLicense() {
    const licencse = await firstValueFrom(
      this.httpClient.get('/3rdpartylicenses.txt', { responseType: 'text' })
    );
    //TODO: print this in a dialog since alert is limited to the size
    alert(licencse);
  }
}
