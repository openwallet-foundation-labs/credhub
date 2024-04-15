import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  constructor(public authService: AuthService) {}
}
