import { Column } from 'typeorm';

export class BaseState {
  @Column({ nullable: true })
  correlationId?: string;
}
