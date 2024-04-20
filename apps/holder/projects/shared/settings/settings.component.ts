import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth/auth.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SettingsService } from './settings.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from 'ng-flex-layout';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatButtonModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    FlexLayoutModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  automateControl: FormControl;

  constructor(
    public authService: AuthService,
    public settingsService: SettingsService
  ) {
    this.automateControl = new FormControl(this.settingsService.getAuto());
    this.automateControl.valueChanges.subscribe((value) =>
      this.settingsService.setAuto(value)
    );
  }
}
