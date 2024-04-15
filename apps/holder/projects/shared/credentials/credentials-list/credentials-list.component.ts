import { Component, OnInit } from '@angular/core';
import { Credential, CredentialsApiService } from '../../api/kms';
import { firstValueFrom } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { CredentialsShowComponent } from '../credentials-show/credentials-show.component';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import {
  CredentialsSupportedDisplay,
  MetadataDisplay,
} from '@sphereon/oid4vci-common';
import { RouterLink } from '@angular/router';
import { FlexLayoutModule } from 'ng-flex-layout';

export interface CredentialList extends Credential {
  display: CredentialsSupportedDisplay;
  issuer: MetadataDisplay;
}

@Component({
  selector: 'app-credentials-list',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    MatListModule,
    MatCardModule,
    CredentialsShowComponent,
    FlexLayoutModule,
  ],
  templateUrl: './credentials-list.component.html',
  styleUrl: './credentials-list.component.scss',
})
export class CredentialsListComponent implements OnInit {
  credentials: CredentialList[] = [];

  render: 'image' | 'card' = 'card';

  constructor(private credentialsApiService: CredentialsApiService) {}

  async ngOnInit(): Promise<void> {
    this.credentials = await firstValueFrom(
      this.credentialsApiService.credentialsControllerFindAll()
    );
  }
}
