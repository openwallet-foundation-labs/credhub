import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CredentialOfferSession,
  SessionsApiService,
} from '@credhub/issuer-shared';
import { firstValueFrom } from 'rxjs';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-sessions-list',
  standalone: true,
  imports: [CommonModule, MatListModule],
  templateUrl: './sessions-list.component.html',
  styleUrl: './sessions-list.component.scss',
})
export class SessionsListComponent implements OnInit, OnDestroy {
  sessions: CredentialOfferSession[] = [];
  interval!: NodeJS.Timeout;

  constructor(private sessionsApiService: SessionsApiService) {}
  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  async ngOnInit(): Promise<void> {
    this.interval = setInterval(() => {
      firstValueFrom(this.sessionsApiService.issuerControllerListAll()).then(
        (sessions) => (this.sessions = sessions)
      );
    }, 1000);
  }
}
