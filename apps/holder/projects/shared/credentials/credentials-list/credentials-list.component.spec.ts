import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CredentialsListComponent } from './credentials-list.component';

describe('CredentialsListComponent', () => {
  let component: CredentialsListComponent;
  let fixture: ComponentFixture<CredentialsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CredentialsListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CredentialsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
