import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Template,
  TemplateDto,
  TemplatesApiService,
} from '@credhub/verifier-shared';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from 'ng-flex-layout';
import JSONEditor, { JSONEditorOptions } from 'jsoneditor';
import { schema } from './schema.value';

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
export class TemplatesEditComponent implements AfterViewInit {
  id?: string | null;
  template!: TemplateDto;

  valid = true;
  @ViewChild('jsonEditorContainer', { static: false })
  jsonEditorContainer!: ElementRef;
  editor!: JSONEditor;

  constructor(
    private templatesApiService: TemplatesApiService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  async ngAfterViewInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.template = await firstValueFrom(
        this.templatesApiService.templatesControllerGetOne(this.id)
      ).then((template) => template.value);
    } else {
      //this.template = {};
    }

    //TODO: instead the monaco-editor editor should be used, but it resulted in errors when building (no loader for ttf files). Also it was not clear how to make sure that the validation was working. But it had better auto completion and syntax highlighting.
    const container = this.jsonEditorContainer.nativeElement;
    const options: JSONEditorOptions = {
      schema,
      mode: 'code',
      onChange: this.validate.bind(this),
    };
    this.editor = new JSONEditor(container, options, this.template);
    setTimeout(() => this.validate(), 100);
  }

  private async validate() {
    const errors = await this.editor.validate();
    const hasSchemaErrors = errors && errors.length > 0;
    if (hasSchemaErrors) {
      this.valid = false;
      return;
    }
    this.valid = true;
  }

  save(): void {
    const content: TemplateDto = this.editor.get();
    firstValueFrom(
      this.templatesApiService.templatesControllerUpdate(
        this.id as string,
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
