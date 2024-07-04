import { Template } from './dto/template.dto';

export abstract class TemplatesService {
  abstract listAll(): Promise<Template[]>;
  abstract getOne(id: string): Promise<Template>;
  abstract create(data: Template): Promise<void>;
  abstract update(id: string, data: Template): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
