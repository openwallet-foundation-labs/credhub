import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'lib-licenses',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './licenses.component.html',
  styleUrl: './licenses.component.scss',
})
export class LicensesComponent implements OnInit {
  licenses!: string;

  constructor(private httpClient: HttpClient) {}

  /**
   * Fetches the licenses file from generated txt file.
   */
  async ngOnInit(): Promise<void> {
    this.licenses = await firstValueFrom(
      this.httpClient.get('/3rdpartylicenses.txt', { responseType: 'text' })
    );
  }
}
