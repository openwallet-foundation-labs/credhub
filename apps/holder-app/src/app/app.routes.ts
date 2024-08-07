import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { ScannerComponent } from './scanner/scanner.component';
import { LoginComponent } from './login/login.component';
import {
  CredentialsListComponent,
  CredentialsShowComponent,
  HistoryListComponent,
  HistoryShowComponent,
  SettingsComponent,
} from '@credhub/holder-shared';
import { guestGuard } from './auth/guest.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/credentials',
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
        children: [
          {
            path: ':id',
            component: CredentialsShowComponent,
          },
        ],
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
    canActivate: [guestGuard],
    component: LoginComponent,
  },
];
