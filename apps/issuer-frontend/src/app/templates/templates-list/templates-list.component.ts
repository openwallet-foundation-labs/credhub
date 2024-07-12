import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Template, TemplatesApiService } from '@credhub/issuer-shared';
import { firstValueFrom } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCard, MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-templates-list',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
  ],
  templateUrl: './templates-list.component.html',
  styleUrl: './templates-list.component.scss',
})
export class TemplatesListComponent implements OnInit {
  templates: Template[] = [];
  constructor(private templatesApiService: TemplatesApiService) {}

  async ngOnInit(): Promise<void> {
    this.templates = await firstValueFrom(
      this.templatesApiService.templatesControllerListAll()
    );
  }
}
