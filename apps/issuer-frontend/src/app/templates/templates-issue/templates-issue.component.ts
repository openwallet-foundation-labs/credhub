import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  IssuerService,
  Template,
  TemplatesApiService,
} from '@credhub/issuer-shared';
import qrcode from 'qrcode';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FlexLayoutModule } from 'ng-flex-layout';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-templates-issue',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatCardModule,
    RouterModule,
  ],
  templateUrl: './templates-issue.component.html',
  styleUrl: './templates-issue.component.scss',
})
export class TemplatesIssueComponent implements OnInit, OnDestroy {
  form: FormGroup;
  qrCodeField = new FormControl('');
  qrCodeImage?: string;
  pinRequired = new FormControl<boolean>(false);
  pinField = new FormControl('');
  id!: string;
  template!: Template;

  constructor(
    public issuerService: IssuerService,
    private templatesApiService: TemplatesApiService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {
    this.form = new FormGroup({});
  }
  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get('id') as string;
    this.template = await firstValueFrom(
      this.templatesApiService.templatesControllerGetOne(this.id)
    );
    this.generateForm();
  }

  ngOnDestroy(): void {
    this.issuerService.stop();
  }

  generateForm() {
    for (const key in this.template.schema.claims) {
      this.form.addControl(key, new FormControl(''));
    }
  }

  async generate() {
    this.pinField.setValue('');

    const response = await this.issuerService.getUrl(this.id, this.form.value, {
      pin: this.pinRequired.value as boolean,
    });
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
