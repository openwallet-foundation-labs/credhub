import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { TxCodeInfo } from '../../api';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlexLayoutModule } from 'ng-flex-layout';

@Component({
  selector: 'lib-tx-code-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    ReactiveFormsModule,
    FlexLayoutModule,
  ],
  templateUrl: './tx-code-dialog.component.html',
  styleUrl: './tx-code-dialog.component.scss',
})
export class TxCodeDialogComponent {
  readonly data = inject<TxCodeInfo>(MAT_DIALOG_DATA);
  input = new FormControl('', Validators.required);
}
