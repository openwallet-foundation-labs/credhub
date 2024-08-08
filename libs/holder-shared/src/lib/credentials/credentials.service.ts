import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CredentialsService {
  public deletedEmitter = new EventEmitter<string>();
}
