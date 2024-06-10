import { Component } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { FlexLayoutModule } from 'ng-flex-layout';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatButtonModule, FlexLayoutModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  constructor(public authService: AuthService, private route: ActivatedRoute) {}

  login() {
    // get the targeturl when passed in the query params
    const targetUrl = this.route.snapshot.queryParams['targetUrl'];
    this.authService.login(targetUrl !== 'login' ? targetUrl : null);
  }
}
