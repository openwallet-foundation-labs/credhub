import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from 'ng-flex-layout';
import { ConfigService } from '../config.service';

@Component({
  selector: 'lib-backend-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    FlexLayoutModule,
  ],
  templateUrl: './backend-dialog.component.html',
  styleUrl: './backend-dialog.component.scss',
})
export class BackendDialogComponent {
  input: FormControl;
  dialogRef = inject(MatDialogRef);

  constructor(private configService: ConfigService) {
    this.input = new FormControl(this.configService.getPersistedBackend(), [
      Validators.required,
      Validators.pattern(/https?:\/\/.*/),
    ]);
  }

  /**
   * Gets the one loaded from the config file
   */
  setDefault() {
    this.input.setValue(this.configService.getDefaultBackend());
  }

  store() {
    this.configService.changeBackend(this.input.value as string).then(
      () => this.dialogRef.close(),
      () => this.input.setErrors({ unavailable: true })
    );
  }
}
