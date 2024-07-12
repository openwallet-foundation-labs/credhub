import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Template, TemplatesApiService } from '@credhub/verifier-shared';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-templates-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatCardModule,
  ],
  templateUrl: './templates-create.component.html',
  styleUrl: './templates-create.component.scss',
})
export class TemplatesCreateComponent implements OnInit {
  control!: FormControl;

  constructor(
    private templatesApiService: TemplatesApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    this.control = new FormControl('{}', this.isValidJson);
  }

  isValidJson(control: AbstractControl): ValidationErrors | null {
    try {
      JSON.parse(control.value);
    } catch (e) {
      return { invalidJson: true };
    }
    return null;
  }

  save(): void {
    const content: Template = JSON.parse(this.control.value);
    firstValueFrom(
      this.templatesApiService.templatesControllerUpdate(
        content.request.id,
        content
      )
    ).then(() =>
      this.router
        .navigate(['/templates'])
        .then(() =>
          this.snackBar.open('Template created', 'Dismiss', { duration: 3000 })
        )
    );
  }
}
