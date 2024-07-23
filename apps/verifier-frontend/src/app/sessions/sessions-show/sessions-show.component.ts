import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthRequestStateEntity,
  SiopApiService,
} from '@credhub/verifier-shared';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sessions-show',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './sessions-show.component.html',
  styleUrl: './sessions-show.component.scss',
})
export class SessionsShowComponent implements OnInit, OnDestroy {
  session!: AuthRequestStateEntity;
  interval!: ReturnType<typeof setInterval>;
  id!: string;
  sessionId!: string;

  constructor(
    private templatesApiService: SiopApiService,
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
      this.templatesApiService.siopControllerGetAuthRequestStatus(
        this.id,
        this.sessionId
      )
    ).then((session) => (this.session = session));
  }

  delete() {
    if (!confirm('Are you sure you want to delete this session?')) return;
    firstValueFrom(
      this.templatesApiService.siopControllerDeleteAuthRequest(
        this.id,
        this.sessionId
      )
    ).then(() => this.router.navigate(['/templates', this.id]));
  }
}
