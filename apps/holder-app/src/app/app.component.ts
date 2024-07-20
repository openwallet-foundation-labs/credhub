import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { CheckForUpdatesService } from './check-for-updates.service';
import { SettingsService } from '@credhub/holder-shared';
import { AuthService } from './auth/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    FlexLayoutModule,
    MatMenuModule,
  ],
  providers: [CheckForUpdatesService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  loggedIn = false;
  constructor(
    private checkForUpdatesService: CheckForUpdatesService,
    private settingsService: SettingsService,
    private authService: AuthService,
    private router: Router
  ) {}
  async ngOnInit(): Promise<void> {
    const loggedIn = await firstValueFrom(
      this.authService.canActivateProtectedRoutes$
    );
    if (loggedIn) {
      this.loggedIn = true;
      this.settingsService.setThemeToApplication();
    } else {
      document.getElementById('content')?.removeAttribute('class');
    }
  }

  showScanner() {
    this.router
      .navigateByUrl('/', { skipLocationChange: true })
      .then(() => this.router.navigateByUrl('/scan'));
  }
}
