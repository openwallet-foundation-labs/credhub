import { Component, Input, OnInit } from '@angular/core';
import { Oid4vpParseRepsonse } from '../../api/';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FlexLayoutModule } from 'ng-flex-layout';
import { firstValueFrom } from 'rxjs';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SettingsService } from '../../settings/settings.service';
import { Oid4vcpApiService } from '../../api/api/oid4vcp.service';
import { WebauthnService } from '../../auth/webauthn.service';

@Component({
  selector: 'lib-verify-request',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    FlexLayoutModule,
    MatSnackBarModule,
    MatListModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './verify-request.component.html',
  styleUrl: './verify-request.component.scss',
})
export class VerifyRequestComponent implements OnInit {
  @Input() url!: string;
  response?: Oid4vpParseRepsonse;
  form = new FormGroup({});
  auto!: boolean;

  status?: 'select' | 'done';
  noMatch = false;

  constructor(
    private oid4vpApiService: Oid4vcpApiService,
    private router: Router,
    private snackBar: MatSnackBar,
    private settingsService: SettingsService,
    private webauthnService: WebauthnService
  ) {}

  async ngOnInit(): Promise<void> {
    this.auto = await this.settingsService.getAuto();
    this.response = await firstValueFrom(
      this.oid4vpApiService.oid4vpControllerParse({
        url: this.url,
      })
    );
    for (const request of this.response.requests) {
      if (request.credentials.length === 0) {
        this.noMatch = true;
        return;
      }
      const value = this.auto ? [request.credentials[0].jti] : '';
      this.form.addControl(
        request.id,
        new FormControl(value, Validators.required)
      );
    }
    if (this.auto) {
      this.submit();
    }
  }

  async submit() {
    const values: Record<string, string> = {};
    for (const key of Object.keys(this.form.value)) {
      values[key] = (this.form.value as Record<string, string[]>)[key][0];
    }

    if (await this.webauthnService.hasKeys()) {
      const auth = await this.webauthnService.authenticate();
      await firstValueFrom(
        this.oid4vpApiService.oid4vpControllerSubmit(
          (this.response as Oid4vpParseRepsonse).sessionId,
          {
            values,
            auth,
          }
        )
      ).then(() => {
        this.status = 'done';
      });
      return;
    } else {
      await firstValueFrom(
        this.oid4vpApiService.oid4vpControllerSubmit(
          (this.response as Oid4vpParseRepsonse).sessionId,
          { values }
        )
      ).then(() => {
        this.status = 'done';
      });
    }
  }

  async cancel() {
    await firstValueFrom(
      this.oid4vpApiService.oid4vpControllerDecline(
        (this.response as Oid4vpParseRepsonse).sessionId
      )
    );
    this.router.navigate(['/']);
    this.snackBar.open('Cancelled', '', { duration: 3000 });
  }
}
