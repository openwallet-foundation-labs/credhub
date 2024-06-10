import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SettingsService } from './settings.service';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatListModule } from '@angular/material/list';
import { firstValueFrom } from 'rxjs';
import { AuthApiService, SettingsApiService } from '../api';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LicensesComponent } from './licenses/licenses.component';

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
    MatDialogModule,
  ],
})
export class SettingsComponent implements OnInit {
  form!: FormGroup;
  keycloakLink: string;

  constructor(
    public authService: AuthServiceInterface,
    private authApiService: AuthApiService,
    public settingsService: SettingsService,
    private settingsApiService: SettingsApiService,
    private matDialog: MatDialog
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

  async deleteAccount() {
    if (!confirm('Are you sure you want to delete your account?')) return;
    await firstValueFrom(this.authApiService.authControllerDeleteAccount());
    this.authService.logout();
  }

  async showLicense() {
    this.matDialog.open(LicensesComponent);
  }
}
