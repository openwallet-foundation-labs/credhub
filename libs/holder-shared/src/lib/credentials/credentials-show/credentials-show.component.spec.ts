import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CredentialsShowComponent } from './credentials-show.component';

describe('CredentialsShowComponent', () => {
  let component: CredentialsShowComponent;
  let fixture: ComponentFixture<CredentialsShowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CredentialsShowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CredentialsShowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
