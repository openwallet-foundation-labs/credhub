import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Template as TemplateDTO } from '../dto/template.dto';

@Entity()
export class Template {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'json' })
  value: TemplateDTO;
}
