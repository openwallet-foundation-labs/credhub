import { Injectable } from '@angular/core';
import { SettingsApiService } from '../api';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor(private settingsService: SettingsApiService) {}

  getAuto() {
    return firstValueFrom(
      this.settingsService.settingsControllerGetSettings()
    ).then((res) => res.auto);
  }

  getDarkTheme() {
    return firstValueFrom(
      this.settingsService.settingsControllerGetSettings()
    ).then((res) => res.darkTheme);
  }

  setTheme() {
    this.getDarkTheme().then((darkTheme) => {
      if (darkTheme) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    });
  }
}
