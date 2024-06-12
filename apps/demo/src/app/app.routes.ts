import { Route } from '@angular/router';
import { DemoListComponent } from './demo-list/demo-list.component';
import { EidComponent } from './eid/eid.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: DemoListComponent,
  },
  {
    path: 'eid',
    component: EidComponent,
  },
];
