import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Template, TemplatesApiService } from '@credhub/verifier-shared';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from 'ng-flex-layout';

@Component({
  selector: 'app-templates-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    RouterModule,
    FlexLayoutModule,
  ],
  templateUrl: './templates-edit.component.html',
  styleUrl: './templates-edit.component.scss',
})
export class TemplatesEditComponent implements OnInit {
  template!: Template;

  control!: FormControl;

  constructor(
    private templatesApiService: TemplatesApiService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.template = await firstValueFrom(
      this.templatesApiService.templatesControllerGetOne(id)
    );
    this.control = new FormControl(JSON.stringify(this.template, null, 2), [
      this.isValidJson,
    ]);
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
          this.snackBar.open('Template saved', 'Dismiss', { duration: 3000 })
        )
    );
  }
}
