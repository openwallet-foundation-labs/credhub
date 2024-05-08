import { ApplicationRef, Injectable, isDevMode } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { first, interval, concat, filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CheckForUpdatesService {
  constructor(
    appRef: ApplicationRef,
    updates: SwUpdate,
    snackBar: MatSnackBar
  ) {
    if (isDevMode()) return;
    // Allow the app to stabilize first, before starting
    // polling for updates with `interval()`.
    const appIsStable$ = appRef.isStable.pipe(
      first((isStable) => isStable === true)
    );
    const everySixHours$ = interval(6 * 60 * 60 * 1000);
    const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

    everySixHoursOnceAppIsStable$.subscribe(async () => {
      try {
        const updateFound = await updates.checkForUpdate();
        console.log(
          updateFound
            ? 'A new version is available.'
            : 'Already on the latest version.'
        );
      } catch (err) {
        console.error('Failed to check for updates:', err);
      }
    });
    updates.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
      )
      .subscribe(() => {
        snackBar
          .open('New version available', 'Activate')
          .onAction()
          .subscribe(() => {
            document.location.reload();
          });
      });
  }
}
