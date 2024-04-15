import { Component, Input, OnInit } from '@angular/core';
import { Oid4vciApiService } from '../../../../shared/api/kms';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  CredentialIssuerMetadata,
  CredentialSupported,
  MetadataDisplay,
} from '@sphereon/oid4vci-common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-issuance-request',
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

  constructor(
    private oid4vciApiService: Oid4vciApiService,
    private router: Router,
    private snackbar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    await firstValueFrom(
      this.oid4vciApiService.oid4vciControllerParse({
        url: this.url,
      })
    ).then((res) => {
      this.session = res.sessionId;
      this.issuer = res.issuer as MetadataDisplay[];
      this.credentials = res.credentials as CredentialSupported[];
    });
  }

  deny() {
    throw new Error('Method not implemented.');
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
