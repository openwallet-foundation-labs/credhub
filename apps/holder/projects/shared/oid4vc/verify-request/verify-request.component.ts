import { Component, Input, OnInit } from '@angular/core';
import { Oid4vcpApiService, Oid4vpParseRepsonse } from '../../api/kms';
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

@Component({
  selector: 'app-verify-request',
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
  auto: boolean;

  status?: 'select' | 'done';

  constructor(
    private oid4vpApiService: Oid4vcpApiService,
    private router: Router,
    private snackBar: MatSnackBar,
    private settingsService: SettingsService
  ) {
    this.auto = this.settingsService.getAuto();
  }

  async ngOnInit(): Promise<void> {
    this.response = await firstValueFrom(
      this.oid4vpApiService.oid4vpControllerParse({
        url: this.url,
      })
    );
    for (const request of this.response.requests) {
      if (request.credentials.length === 0) {
        throw new Error(
          `No matching credentials for request ${request.purpose}`
        );
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

    await firstValueFrom(
      this.oid4vpApiService.oid4vpControllerSubmit(
        (this.response as Oid4vpParseRepsonse).sessionId,
        values
      )
    ).then(() => {
      this.status = 'done';
      // this.router
      //   .navigate(['/'])
      //   .then(() => this.snackBar.open('Submitted', '', { duration: 3000 }))
    });
  }

  cancel() {
    this.router.navigate(['/']);
    this.snackBar.open('Cancelled', '', { duration: 3000 });
  }
}
