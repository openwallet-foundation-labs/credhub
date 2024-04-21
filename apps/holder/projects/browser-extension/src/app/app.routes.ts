import { Routes } from '@angular/router';
import { CredentialsListComponent } from '../../../shared/credentials/credentials-list/credentials-list.component';
import { CredentialsShowComponent } from '../../../shared/credentials/credentials-show/credentials-show.component';
import { ScannerComponent } from './scanner/scanner.component';
import { SettingsComponent } from '../../../shared/settings/settings.component';
import { authGuard } from './auth/auth.guard';
import { LoginComponent } from './login/login.component';
import { HistoryListComponent } from '../../../shared/history/history-list/history-list.component';
import { HistoryShowComponent } from '../../../shared/history/history-show/history-show.component';
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/login',
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'scan',
        component: ScannerComponent,
      },
      {
        path: 'credentials',
        component: CredentialsListComponent,
      },
      {
        path: 'credentials/:id',
        component: CredentialsShowComponent,
      },
      {
        path: 'history',
        component: HistoryListComponent,
      },
      {
        path: 'history/:id',
        component: HistoryShowComponent,
      },
      {
        path: 'settings',
        component: SettingsComponent,
      },
    ],
  },
  {
    path: 'login',
    component: LoginComponent,
  },
];
