import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthStateEntity, SiopApiService } from '@credhub/verifier-shared';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import * as qrcode from 'qrcode';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { digest } from '@sd-jwt/crypto-browser';

@Component({
  selector: 'app-sessions-show',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatSnackBarModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    FlexLayoutModule,
    RouterModule,
    ReactiveFormsModule,
    MatInputModule,
  ],
  templateUrl: './sessions-show.component.html',
  styleUrl: './sessions-show.component.scss',
})
export class SessionsShowComponent implements OnInit, OnDestroy {
  session!: any;
  interval!: ReturnType<typeof setInterval>;
  id!: string;
  sessionId!: string;

  qrCodeField = new FormControl('');
  qrCodeImage?: string;
  expired = false;
  exp!: Date;
  nbf!: Date;
  claims?: unknown;

  constructor(
    private templatesApiService: SiopApiService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}
  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get('id') as string;
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') as string;

    await this.loadSession();
    this.nbf = new Date(this.session.request.nbf * 1000);
    this.exp = new Date(this.session.request.exp * 1000);
    if (this.exp < new Date()) {
      this.expired = true;
    }
    if (this.session.status === 'verified') {
      this.loadResponse();
    } else if (!this.expired) {
      this.loadUri();
      this.interval = setInterval(() => this.loadSession(), 1000);
    }
  }

  private async loadUri() {
    const res = await firstValueFrom(
      this.templatesApiService.siopControllerGetAuthRequestUri(
        this.id,
        this.sessionId
      )
    ).then((res) => res.uri);

    this.qrCodeField.setValue(res);
    this.qrCodeImage = await qrcode.toDataURL(res);
    this.copyValue(res);
  }

  private loadSession() {
    return firstValueFrom(
      this.templatesApiService.siopControllerGetAuthRequestStatus(
        this.id,
        this.sessionId
      )
    ).then((session) => (this.session = session));
  }

  private async loadResponse() {
    const sdjwtInstance = new SDJwtVcInstance({
      hasher: digest,
    });
    console.log(this.session);
    const token = await sdjwtInstance.decode(this.session.response.vp_token);
    //TODO: render the credential with the information like issuer, claims, dates, etc.
    this.claims = await token.getClaims(digest);
  }

  copyValue(value: string) {
    navigator.clipboard.writeText(value);
    this.snackBar.open('URL copied to clipboard');
  }

  delete() {
    if (!confirm('Are you sure you want to delete this session?')) return;
    firstValueFrom(
      this.templatesApiService.siopControllerDeleteAuthRequest(
        this.id,
        this.sessionId
      )
    ).then(() => this.router.navigate(['/templates', this.id]));
  }
}
