import { Routes } from '@angular/router';
import { TemplatesListComponent } from './templates/templates-list/templates-list.component';
import { TemplatesShowComponent } from './templates/templates-show/templates-show.component';
import { TemplatesIssueComponent } from './templates/templates-issue/templates-issue.component';
import { TemplatesEditComponent } from './templates/templates-edit/templates-edit.component';
import { SessionsShowComponent } from './sessions/sessions-show/sessions-show.component';
import { SessionsListComponent } from './sessions/sessions-list/sessions-list.component';

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
        component: TemplatesEditComponent,
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
        path: ':id/issue',
        component: TemplatesIssueComponent,
      },
    ],
  },
  {
    path: 'sessions',
    children: [
      {
        path: '',
        component: SessionsListComponent,
      },
      {
        path: ':sessionId',
        component: SessionsShowComponent,
      },
    ],
  },
];
