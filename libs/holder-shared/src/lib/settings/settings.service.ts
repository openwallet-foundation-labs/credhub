import { Injectable } from '@angular/core';
import { SettingsApiService } from '../api/kms';
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
}
