import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import {
  SessionEntryDto,
  SessionsApiService,
  StatusApiService,
} from '@credhub/issuer-shared';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { digest } from '@sd-jwt/crypto-browser';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-sessions-show',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    RouterModule,
    MatExpansionModule,
    MatListModule,
    MatCardModule,
    MatIconModule,
    FlexLayoutModule,
    MatSnackBarModule,
  ],
  templateUrl: './sessions-show.component.html',
  styleUrl: './sessions-show.component.scss',
})
export class SessionsShowComponent implements OnInit, OnDestroy {
  session!: SessionEntryDto;
  interval!: ReturnType<typeof setInterval>;
  id!: string;
  sessionId!: string;
  private sdjwt: SDJwtVcInstance;
  credentials: any[] = [];

  constructor(
    private sessionsApiService: SessionsApiService,
    private route: ActivatedRoute,
    private router: Router,
    private statusApiService: StatusApiService,
    private snackbar: MatSnackBar
  ) {
    this.sdjwt = new SDJwtVcInstance({
      hasher: digest,
      hashAlg: 'SHA-256',
    });
  }
  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get('id') as string;
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') as string;
    await this.loadSessions();
    //this.interval = setInterval(() => this.loadSessions(), 1000);
  }

  private async loadSessions() {
    await firstValueFrom(
      this.sessionsApiService.issuerControllerGetSession(this.sessionId)
    ).then((session) => (this.session = session));

    this.credentials = await Promise.all(
      this.session.credentials.map(async (credential) => {
        const sdJWT = await this.sdjwt.decode(credential.value);
        return {
          id: credential.id,
          credential: sdJWT,
          claims: this.getClaims(
            (await this.sdjwt.getClaims(credential.value)) as Record<
              string,
              unknown
            >
          ),
          status: await this.getStatus(
            (sdJWT.jwt!.payload!['status']! as any).status_list
          ),
        };
      })
    );
  }

  getClaims(credential: Record<string, unknown>) {
    //remove all values from the record that are in the excludedFields array
    const excludedFields = ['iat', 'iss', 'vct', 'jti', 'status', 'exp', 'cnf'];
    return Object.keys(credential)
      .filter((key) => !excludedFields.includes(key))
      .map((key) => ({ key, value: credential[key] }));
  }

  delete() {
    if (!confirm('Are you sure you want to delete this session?')) return;
    firstValueFrom(
      this.sessionsApiService.issuerControllerDelete(this.sessionId)
    ).then(() => this.router.navigate(['/templates', this.id]));
  }

  revoke(status: { idx: number; uri: string }) {
    const listId = status.uri.split('/').pop() as string;
    firstValueFrom(
      this.statusApiService.statusControllerChangeStatus(listId, status.idx, {
        status: 1,
      })
    ).then(() => this.snackbar.open('Credential revoked'));
  }

  getStatus(status: { idx: number; uri: string }) {
    const listId = status.uri.split('/').pop() as string;
    return firstValueFrom(
      this.statusApiService.statusControllerGetStatus(listId, status.idx)
    ).then((status) => (status.status === 0 ? 'active' : 'revoked'));
  }
}
