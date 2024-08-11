import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Template as TemplateDTO } from '../dto/template.dto';

@Entity()
export class TemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'json' })
  value: TemplateDTO;
}
