import { Component, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { IssuerService } from '@credhub/issuer-shared';
import { VerifierService } from '@credhub/verifier-shared';
import qrcode from 'qrcode';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FlexLayoutModule } from 'ng-flex-layout';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-eid',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule,
    FlexLayoutModule,
  ],
  templateUrl: './eid.component.html',
  styleUrl: './eid.component.scss',
})
export class EidComponent implements OnDestroy {
  @ViewChild('stepper') stepper!: MatStepper;

  registerForm = new FormGroup({
    prename: new FormControl(
      !environment.production ? 'Max' : '',
      Validators.required
    ),
    surname: new FormControl(
      !environment.production ? 'Mustermann' : '',
      Validators.required
    ),
  });
  issue = new FormControl('', Validators.required);
  qrCodeIssueField = new FormControl('');
  qrCodeIssueImage?: string;
  issuanceUrl?: string;
  present = new FormControl('', Validators.required);
  qrCodeVerifyField = new FormControl('');
  qrCodeVerifyImage?: string;
  verifierUrl?: string;

  constructor(
    public issuerService: IssuerService,
    public verifierService: VerifierService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Stops the services
   */
  ngOnDestroy(): void {
    this.issuerService.stop();
    this.verifierService.stop();
  }

  /**
   * Handles the selection change event
   * @param event
   */
  onSelectionChange(event: StepperSelectionEvent) {
    switch (event.selectedIndex) {
      case 1:
        this.startIssuance();
        break;
      case 2:
        this.issuerService.stop();
        this.startVerification();
        break;
    }
  }

  /**
   * Starts the issuance process
   */
  async startIssuance() {
    const res = await this.issuerService.getUrl(
      undefined,
      this.registerForm.value,
      { pin: false }
    );
    this.qrCodeIssueField.setValue(res.uri);
    this.issuanceUrl = res.uri;
    this.qrCodeIssueImage = await qrcode.toDataURL(res.uri);
    //TODO: show pin
    this.issuerService.statusEvent.subscribe((status) => {
      if (status === 'CREDENTIAL_ISSUED') {
        this.snackBar.open('Credential issued', 'Close', { duration: 3000 });
        this.issue.setValue('CREDENTIAL_ISSUED');
      }
    });
  }

  /**
   * Starts the verification process
   */
  async startVerification() {
    this.verifierUrl = await this.verifierService.getUrl();
    this.qrCodeVerifyField.setValue(this.verifierUrl);
    this.qrCodeVerifyImage = await qrcode.toDataURL(this.verifierUrl);
    this.verifierService.statusEvent.subscribe((status) => {
      if (status === 'verified') {
        this.snackBar.open('Verification successfull', 'Close', {
          duration: 3000,
        });
      }
    });
  }

  /**
   * Copies the value to the clipboard
   * @param value
   * @returns
   */
  copyValue(value?: string) {
    if (!value) return;
    navigator.clipboard.writeText(value);
    this.snackBar.open('URL copied to clipboard', 'Close', { duration: 3000 });
  }

  /**
   * Resets the stepper to the first step
   */
  reset() {
    this.issuerService.stop();
    this.verifierService.stop();
    this.registerForm.reset();
    this.stepper.reset();
  }
}
