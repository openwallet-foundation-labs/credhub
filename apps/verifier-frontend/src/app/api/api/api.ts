export * from './default.service';
import { DefaultApiService } from './default.service';
export * from './siop.service';
import { SiopApiService } from './siop.service';
export const APIS = [DefaultApiService, SiopApiService];
