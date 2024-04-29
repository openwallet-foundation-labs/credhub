import { OmitType } from '@nestjs/swagger';
import { Setting } from '../entities/setting.entity';

export class UpdateSettingsDto extends OmitType(Setting, ['user'] as const) {}
