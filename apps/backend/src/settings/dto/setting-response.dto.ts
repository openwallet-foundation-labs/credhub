import { OmitType } from '@nestjs/swagger';
import { Setting } from '../entities/setting.entity';

export class SettingResponse extends OmitType(Setting, ['user'] as const) {}
