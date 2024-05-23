import { Component, OnInit } from '@angular/core';
import { CredentialResponse, CredentialsApiService } from '../../api/';
import { firstValueFrom } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { CredentialsShowComponent } from '../credentials-show/credentials-show.component';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { CredentialsSupportedDisplay } from '@sphereon/oid4vci-common';
import { RouterLink } from '@angular/router';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

export interface CredentialList extends CredentialResponse {
  display: CredentialsSupportedDisplay;
}

type ShowType = 'all' | 'archived';

@Component({
  selector: 'lib-credentials-list',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    MatListModule,
    MatCardModule,
    CredentialsShowComponent,
    FlexLayoutModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatInputModule,
  ],
  templateUrl: './credentials-list.component.html',
  styleUrl: './credentials-list.component.scss',
})
export class CredentialsListComponent implements OnInit {
  credentials: CredentialList[] = [];

  search: FormControl = new FormControl('');

  render: 'image' | 'card' = 'card';

  type: ShowType = 'all';

  constructor(private credentialsApiService: CredentialsApiService) {}

  async ngOnInit(): Promise<void> {
    this.loadCredentials();
  }

  /**
   * Load credentials from the API
   */
  private async loadCredentials() {
    const credentials: CredentialList[] = await firstValueFrom(
      this.credentialsApiService.credentialsControllerFindAll(
        this.type === 'archived' ? true : undefined
      )
    );
    this.search.valueChanges.subscribe((value: string) => {
      if (!value) {
        this.credentials = credentials;
        return;
      }
      this.credentials = credentials.filter((credential) => {
        return credential.display.name
          .toLowerCase()
          .includes(value.toLowerCase());
      });
    });
    this.credentials = credentials;
  }

  show(type: ShowType) {
    this.type = type;
    this.loadCredentials();
  }
}
