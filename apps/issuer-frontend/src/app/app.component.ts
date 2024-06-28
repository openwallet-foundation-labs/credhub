import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import qrcode from 'qrcode';
import { FlexLayoutModule } from 'ng-flex-layout';
import { IssuerService } from '@credhub/issuer-shared';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  form: FormGroup;
  qrCodeField = new FormControl('');
  qrCodeImage?: string;
  pinField = new FormControl('');

  constructor(
    public issuerService: IssuerService,
    private snackBar: MatSnackBar
  ) {
    this.form = new FormGroup({
      pin: new FormControl(false),
    });
  }

  async generate() {
    this.pinField.setValue('');

    const response = await this.issuerService.getUrl(
      undefined,
      {
        prename: 'Max',
        surname: 'Mustermann',
      },
      this.form.value
    );
    this.qrCodeField.setValue(response.uri);
    if (response.userPin) {
      this.pinField.setValue(response.userPin);
    }
    this.qrCodeImage = await qrcode.toDataURL(response.uri);
    this.copyValue(response.uri);
  }

  copyValue(value: string) {
    navigator.clipboard.writeText(value);
    this.snackBar.open('Copied to clipboard', 'Close', { duration: 2000 });
  }
}
