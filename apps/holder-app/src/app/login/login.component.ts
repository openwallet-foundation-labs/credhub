import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BackendDialogComponent } from './backend-dialog/backend-dialog.component';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../config.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatButtonModule, FlexLayoutModule, MatDialogModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  name!: string;

  constructor(
    public authService: AuthService,
    private route: ActivatedRoute,
    private matDialog: MatDialog,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.name = this.configService.getConfig('name');
  }

  login() {
    // get the targeturl when passed in the query params
    const targetUrl = this.route.snapshot.queryParams['targetUrl'];
    this.authService.login(targetUrl !== 'login' ? targetUrl : null);
  }

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
}
