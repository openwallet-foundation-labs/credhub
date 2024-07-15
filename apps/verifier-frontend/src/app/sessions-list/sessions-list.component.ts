import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { SiopApiService } from '@credhub/verifier-shared';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-sessions-list',
  standalone: true,
  imports: [CommonModule, MatListModule],
  templateUrl: './sessions-list.component.html',
  styleUrl: './sessions-list.component.scss',
})
export class SessionsListComponent implements OnInit, OnDestroy {
  sessions: any[] = [];
  interval!: any;

  constructor(
    private templatesApiService: SiopApiService,
    private route: ActivatedRoute
  ) {}
  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') as string;
    this.interval = setInterval(() => {
      firstValueFrom(
        this.templatesApiService.siopControllerGetAllAuthRequest(id)
      ).then((sessions) => (this.sessions = sessions));
    }, 1000);
  }
}
