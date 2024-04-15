import { Component, Input, OnInit } from '@angular/core';
import {
  Oid4vcpApiService,
  Oid4vpParseRepsonse,
} from '../../../../shared/api/kms';
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
import { Router, RouterModule } from '@angular/router';

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
  ],
  templateUrl: './verify-request.component.html',
  styleUrl: './verify-request.component.scss',
})
export class VerifyRequestComponent implements OnInit {
  @Input() url!: string;
  response?: Oid4vpParseRepsonse;
  form = new FormGroup({});

  constructor(
    private oid4vpApiService: Oid4vcpApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    this.response = await firstValueFrom(
      this.oid4vpApiService.oid4vpControllerParse({
        url: this.url,
      })
    );
    for (const request of this.response.requests) {
      this.form.addControl(
        request.id,
        new FormControl('', Validators.required)
      );
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
    ).then(() =>
      this.router
        .navigate(['/'])
        .then(() => this.snackBar.open('Submitted', '', { duration: 3000 }))
    );
  }

  cancel() {
    this.router.navigate(['/']);
    this.snackBar.open('Cancelled', '', { duration: 3000 });
  }
}
