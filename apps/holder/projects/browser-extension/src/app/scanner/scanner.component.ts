import { Component, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { ResultScan, ScannerService } from './scanner.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    FlexLayoutModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: './scanner.component.html',
  styleUrl: './scanner.component.scss',
})
export class ScannerComponent implements OnInit {
  urlField!: FormControl;

  constructor(
    public scanner: ScannerService,
    private httpClient: HttpClient
  ) {}

  ngOnInit(): void {
    this.scanner.results = [];
    this.urlField = new FormControl('');
    this.urlField.valueChanges.subscribe((value) => {
      if (
        value.startsWith('openid-credential-offer://') ||
        value.startsWith('openid://')
      ) {
        this.scanner.results = [];
        this.scanner.parse(value);
      }
    });
  }
  process(result: ResultScan) {
    this.scanner.accept(result);
  }

  async presentCredential() {
    const response = await firstValueFrom(
      this.httpClient.post<{ uri: string }>(
        `${environment.demoVerifier}/request`,
        {}
      )
    );
    this.urlField.patchValue(response.uri);
  }

  async getCredential() {
    const response = await firstValueFrom(
      this.httpClient.post<{ uri: string }>(
        `${environment.demoIssuer}/request`,
        {}
      )
    );
    this.urlField.patchValue(response.uri);
  }
}
