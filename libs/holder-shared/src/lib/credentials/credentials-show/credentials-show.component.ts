import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CredentialResponse, CredentialsApiService } from '../../api/kms';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CredentialSupportedSdJwtVc } from '@sphereon/oid4vci-common';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-credentials-show',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatListModule,
    FlexLayoutModule,
    MatMenuModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './credentials-show.component.html',
  styleUrl: './credentials-show.component.scss',
})
export class CredentialsShowComponent implements OnInit {
  metadata!: CredentialSupportedSdJwtVc;
  credential!: CredentialResponse;
  claims: { key: string; value: unknown }[] = [];
  status: 'valid' | 'expired' = 'valid';

  constructor(
    private credentialsApiService: CredentialsApiService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') as string;
    // get the credential from the servder
    await firstValueFrom(
      this.credentialsApiService.credentialsControllerFindOne(id)
    ).then(
      (credential) => {
        this.credential = credential;
      },
      () => {
        this.snackBar.open('Credential not found', 'Close', { duration: 3000 });
        this.router.navigate(['/credentials']);
      }
    );
    if (!this.credential) return;
    this.metadata = this.credential.metaData as CredentialSupportedSdJwtVc;
    //set the status of the credential. Right now we are only checking the expiration date since there is no other validation included. The validation should be done by the backend.
    if ((this.credential.credential as Record<string, unknown>)['exp']) {
      const expired = new Date(
        (this.credential.credential as Record<string, unknown>)['exp'] as number
      );
      if (expired < new Date()) {
        this.status = 'expired';
      }
    }
    const excluded = [
      'iss',
      'sub',
      'aud',
      'exp',
      'nbf',
      'iat',
      'jti',
      'vct',
      'cnf',
    ];
    //TODO: right now we are ignoring the order of the claims that got provided in the metadata.
    this.claims = Object.keys(
      this.credential.credential as Record<string, unknown>
    )
      .filter((key) => !excluded.includes(key))
      .map((key) => {
        return {
          key,
          value: (this.credential.credential as Record<string, unknown>)[key],
        };
      });
  }

  getClaim(key: string): string {
    return (this.credential.credential as Record<string, unknown>)[
      key
    ] as string;
  }

  async delete() {
    if (!confirm('Are you sure you want to delete this credential?')) return;
    await firstValueFrom(
      this.credentialsApiService.credentialsControllerRemove(this.credential.id)
    );
    this.router.navigate(['/credentials']);
  }
}
