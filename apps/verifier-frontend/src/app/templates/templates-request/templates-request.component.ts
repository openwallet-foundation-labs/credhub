import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  VerifierService,
  Template,
  TemplatesApiService,
} from '@credhub/verifier-shared';
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
  selector: 'app-templates-request',
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
  templateUrl: './templates-request.component.html',
  styleUrl: './templates-request.component.scss',
})
export class TemplatesRequestComponent implements OnInit, OnDestroy {
  form: FormGroup;
  qrCodeField = new FormControl('');
  qrCodeImage?: string;
  id!: string;
  template!: Template;

  constructor(
    public verifierService: VerifierService,
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
  }

  ngOnDestroy(): void {
    this.verifierService.stop();
  }

  async generate() {
    const response = await this.verifierService.getUrl(this.id);
    this.qrCodeField.setValue(response);
    this.qrCodeImage = await qrcode.toDataURL(response);
    this.copyValue(response);
  }

  copyValue(value: string) {
    navigator.clipboard.writeText(value);
    this.snackBar.open('URL copied to clipboard');
  }
}
