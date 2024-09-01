import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TemplateDto as TemplateDTO } from '../dto/template.dto';

@Entity()
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'json' })
  value: TemplateDTO;
}
