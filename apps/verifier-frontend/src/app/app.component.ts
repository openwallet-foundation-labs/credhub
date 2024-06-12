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
import { VerifierService } from '@credhub/verifier-shared';

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

  constructor(
    private issuerService: VerifierService,
    private snackBar: MatSnackBar
  ) {}

  async generate() {
    await this.issuerService.getUrl();
    this.qrCodeField.setValue(this.issuerService.uri as string);
    this.qrCodeImage = await qrcode.toDataURL(this.issuerService.uri as string);
    this.copyValue();
  }

  copyValue() {
    if (!this.issuerService.uri) return;
    navigator.clipboard.writeText(this.issuerService.uri);
    this.snackBar.open('URL copied to clipboard', 'Close', { duration: 3000 });
  }
}
