import { Component, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { ResultScan, ScannerService } from './scanner.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from 'ng-flex-layout';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    FlexLayoutModule,
    MatInputModule,
    MatDialogModule,
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
    private dialog: MatDialog,
    private httpClient: HttpClient
  ) {}

  ngOnInit(): void {
    // reset the results
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
    this.dialog
      .open(AcceptRequestComponent, {
        data: result,
        width: '400px',
      })
      .afterClosed()
      .subscribe((result) => {
        console.log(result);
      });
  }

  async verifyRequest() {
    const response = await firstValueFrom(
      this.httpClient.post<{ url: string }>('http://localhost:3001/request', {})
    );
    this.urlField.patchValue(response.url);
  }

  async issueRequest() {
    const response = await firstValueFrom(
      this.httpClient.post<{ uri: string }>('http://localhost:3000/request', {})
    );
    this.urlField.patchValue(response.uri);
  }
}
