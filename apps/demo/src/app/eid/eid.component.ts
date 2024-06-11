import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-eid',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './eid.component.html',
  styleUrl: './eid.component.scss',
})
export class EidComponent implements OnInit {
  issue = new FormControl('', Validators.required);
  present = new FormControl('', Validators.required);

  constructor() {}

  ngOnInit(): void {
    //TODO: reformat issuer and verifer to reuse generated api endpoints
    throw new Error('Method not implemented.');
  }
}
