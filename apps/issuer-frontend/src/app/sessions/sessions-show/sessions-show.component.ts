import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  AuthRequestStateEntity,
  SiopApiService,
} from '@credhub/verifier-shared';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import {
  CredentialOfferSession,
  SessionsApiService,
  SessionStatus,
} from '@credhub/issuer-shared';

@Component({
  selector: 'app-sessions-show',
  standalone: true,
  imports: [CommonModule, MatButtonModule, RouterModule],
  templateUrl: './sessions-show.component.html',
  styleUrl: './sessions-show.component.scss',
})
export class SessionsShowComponent implements OnInit, OnDestroy {
  session!: SessionStatus;
  interval!: ReturnType<typeof setInterval>;
  id!: string;
  sessionId!: string;

  constructor(
    private sessionsApiService: SessionsApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get('id') as string;
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') as string;
    await this.loadSessions();
    this.interval = setInterval(() => this.loadSessions(), 1000);
  }

  private loadSessions() {
    firstValueFrom(
      this.sessionsApiService.issuerControllerGetSession(this.sessionId)
    ).then((session) => (this.session = session));
  }

  delete() {
    if (!confirm('Are you sure you want to delete this session?')) return;
    firstValueFrom(
      this.sessionsApiService.issuerControllerDelete(this.sessionId)
    ).then(() => this.router.navigate(['/templates', this.id]));
  }
}
