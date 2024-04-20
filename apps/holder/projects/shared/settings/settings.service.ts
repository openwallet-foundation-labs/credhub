import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private autoStorage = 'automate';

  getAuto() {
    return localStorage.getItem(this.autoStorage) === 'true';
  }

  setAuto(value: boolean) {
    localStorage.setItem(this.autoStorage, value ? 'true' : 'false');
  }
}
