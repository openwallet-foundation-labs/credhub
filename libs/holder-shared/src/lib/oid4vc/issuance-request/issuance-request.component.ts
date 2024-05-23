import { Component, Input, OnInit } from '@angular/core';
import { Oid4vciApiService } from '../../api/';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CredentialSupported, MetadataDisplay } from '@sphereon/oid4vci-common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { SettingsService } from '../../settings/settings.service';

@Component({
  selector: 'lib-issuance-request',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    FlexLayoutModule,
    MatSnackBarModule,
    MatListModule,
  ],
  templateUrl: './issuance-request.component.html',
  styleUrl: './issuance-request.component.scss',
})
export class IssuanceRequestComponent implements OnInit {
  @Input() url!: string;
  session?: string;
  credentials?: CredentialSupported[];
  issuer?: MetadataDisplay[];
  auto!: boolean;

  constructor(
    private oid4vciApiService: Oid4vciApiService,
    private router: Router,
    private snackbar: MatSnackBar,
    private settingsService: SettingsService
  ) {}

  async ngOnInit(): Promise<void> {
    this.auto = await this.settingsService.getAuto();
    await firstValueFrom(
      this.oid4vciApiService.oid4vciControllerParse({
        url: this.url,
      })
    ).then((res) => {
      this.session = res.sessionId;
      this.issuer = res.issuer as MetadataDisplay[];
      this.credentials = res.credentials as CredentialSupported[];
      if (this.auto) {
        this.accept();
      }
    });
  }

  deny() {
    this.snackbar.open('Issuance Request denied', undefined, {
      duration: 3000,
    });
    this.router.navigate(['/']);
  }
  async accept() {
    await firstValueFrom(
      this.oid4vciApiService.oid4vciControllerAccept(this.session as string)
    ).then((res) =>
      this.router
        .navigate(['/credentials', res.id])
        .then(() =>
          this.snackbar.open('Credential Issued', undefined, { duration: 3000 })
        )
    );
  }
}
