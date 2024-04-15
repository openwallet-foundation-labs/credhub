import { Component, type OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { KeyResponse, KeysApiService } from '../api/kms';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-keys-list',
  standalone: true,
  imports: [
    HttpClientModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    HttpClientModule,
  ],
  templateUrl: './keys-list.component.html',
  styleUrl: './keys-list.component.scss',
})
export class KeysListComponent implements OnInit {
  keys: KeyResponse[] = [];

  constructor(private keysService: KeysApiService) {}

  async ngOnInit(): Promise<void> {
    this.keys = await firstValueFrom(this.keysService.keysControllerFindAll());
  }

  async addKey() {
    const key = await firstValueFrom(
      this.keysService.keysControllerCreate({ type: 'ES256' })
    );
    this.keys.push(key);
  }
}
