import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import qrcode from 'qrcode';
import { FlexLayoutModule } from 'ng-flex-layout';
import { IssuerService } from '@credhub/issuer-shared';

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
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  qrCodeField = new FormControl('');
  qrCodeImage?: string;
  url?: string;

  constructor(
    public issuerService: IssuerService,
    private snackBar: MatSnackBar
  ) {}

  async generate() {
    this.url = await this.issuerService.getUrl(undefined, {
      prename: 'Max',
      surname: 'Mustermann',
    });
    this.qrCodeField.setValue(this.url);
    this.qrCodeImage = await qrcode.toDataURL(this.url);
    this.copyValue();
  }

  copyValue() {
    if (!this.url) return;
    navigator.clipboard.writeText(this.url);
    this.snackBar.open('URL copied to clipboard', 'Close', { duration: 3000 });
  }
}
