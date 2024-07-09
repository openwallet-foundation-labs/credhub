import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { BackendDialogComponent, ConfigService } from '@credhub/holder-shared';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatButtonModule,
    FlexLayoutModule,
    MatInputModule,
    ReactiveFormsModule,
    MatDialogModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  name!: string;

  constructor(
    public authService: AuthService,
    private matDialog: MatDialog,
    private router: Router,
    private configService: ConfigService
  ) {}

  /**
   * Open the dialog to change the backend. Reload the page after the dialog is closed so the new backend is used when the application starts.
   */
  changeBackend() {
    firstValueFrom(
      this.matDialog
        .open(BackendDialogComponent, { disableClose: true })
        .afterClosed()
    ).then(() => window.location.reload());
  }

  ngOnInit(): void {
    this.authService.isAuthenticated().then((isAuthenticated) => {
      if (isAuthenticated) {
        this.router.navigate(['/credentials']);
      }
    });
    this.name = this.configService.getConfig('name');
  }

  async login() {
    await this.authService.login();
    this.router.navigate(['/credentials']);
  }
}
