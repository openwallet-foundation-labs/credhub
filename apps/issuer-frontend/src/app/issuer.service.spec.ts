import { TestBed } from '@angular/core/testing';

import { IssuerService } from './issuer.service';

describe('IssuerService', () => {
  let service: IssuerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IssuerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
