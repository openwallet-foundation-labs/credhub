import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth/auth.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SettingsService } from './settings.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatListModule } from '@angular/material/list';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SettingsApiService } from '../api/kms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatButtonModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    MatListModule,
    HttpClientModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  automateControl!: FormControl<boolean | null>;

  constructor(
    public authService: AuthService,
    public settingsService: SettingsService,
    private httpClient: HttpClient,
    private settingsApiService: SettingsApiService
  ) {
    this.automateControl = new FormControl();
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
