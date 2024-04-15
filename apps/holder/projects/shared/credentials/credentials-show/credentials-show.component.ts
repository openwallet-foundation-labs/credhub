import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Credential, CredentialsApiService } from '../../api/kms';
import { CredentialsService } from '../credentials.service';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CredentialSupportedSdJwtVc } from '@sphereon/oid4vci-common';
import { CommonModule } from '@angular/common';
import { SDJwt } from '@sd-jwt/core';
import { getHasher } from '@sd-jwt/crypto-browser';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface Issuer {
  name: string;
  locale: string;
  logo?: {
    url: string;
    alt_text: string;
  };
}

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
  decoded!: SDJwt;
  credential!: Credential;
  claims: { key: string; value: unknown }[] = [];
  issuer!: Issuer;
  status: 'valid' | 'expired' = 'valid';
  allClaims!: Record<string, unknown>;

  constructor(
    private credentialsService: CredentialsService,
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
      (credential) => (this.credential = credential),
      () => {
        this.snackBar.open('Credential not found', 'Close', { duration: 3000 });
        this.router.navigate(['/credentials']);
      }
    );
    if (!this.credential) return;
    this.decoded = await this.credentialsService.instance.decode(
      this.credential.value
    );
    this.metadata = this.credential.metaData as CredentialSupportedSdJwtVc;
    this.issuer = this.credential.issuer as Issuer;
    this.allClaims =
      await this.decoded.getClaims<Record<string, unknown>>(getHasher());
    //set the status of the credential. Right now we are only checking the expiration date since there is no other validation included. The validation should be done by the backend.
    if (this.allClaims['exp']) {
      const expired = new Date(this.allClaims['exp'] as number);
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
    this.claims = Object.keys(this.allClaims)
      .filter((key) => !excluded.includes(key))
      .map((key) => {
        return { key: this.getKey(key), value: this.allClaims[key] };
      });
  }

  getClaim(key: string): string {
    return this.allClaims[key] as string;
  }

  getKey(key: string): string {
    //TODO select the correct display based on the provided locale.
    return this.metadata.claims![key].display![0].name ?? key;
  }

  async delete() {
    if (!confirm('Are you sure you want to delete this credential?')) return;
    await firstValueFrom(
      this.credentialsApiService.credentialsControllerRemove(this.credential.id)
    );
    this.router.navigate(['/credentials']);
  }
}
