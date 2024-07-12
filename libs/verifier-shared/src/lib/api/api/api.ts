export * from './default.service';
import { DefaultApiService } from './default.service';
export * from './siop.service';
import { SiopApiService } from './siop.service';
export * from './templates.service';
import { TemplatesApiService } from './templates.service';
export const APIS = [DefaultApiService, SiopApiService, TemplatesApiService];
