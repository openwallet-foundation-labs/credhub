import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatInputModule } from '@angular/material/input';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatButtonModule,
    FlexLayoutModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  form: FormGroup = new FormGroup({
    // we can not pass the value during runtime. If it's stored in the localstorage on the start, it's fine.
    endpoint: new FormControl(environment.backendUrl, Validators.required),
  });

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  async login() {
    await this.authService.login();
    this.router.navigate(['/']);
  }
}
