import { Routes } from '@angular/router';
import { TemplatesListComponent } from './templates/templates-list/templates-list.component';
import { TemplatesCreateComponent } from './templates/templates-create/templates-create.component';
import { TemplatesShowComponent } from './templates/templates-show/templates-show.component';
import { TemplatesRequestComponent } from './templates/templates-request/templates-request.component';
import { TemplatesEditComponent } from './templates/templates-edit/templates-edit.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'templates',
    pathMatch: 'full',
  },
  {
    path: 'templates',
    children: [
      {
        path: '',
        component: TemplatesListComponent,
      },
      {
        path: 'new',
        component: TemplatesCreateComponent,
      },
      {
        path: ':id',
        component: TemplatesShowComponent,
      },
      {
        path: ':id/edit',
        component: TemplatesEditComponent,
      },
      {
        path: ':id/request',
        component: TemplatesRequestComponent,
      },
    ],
  },
];
