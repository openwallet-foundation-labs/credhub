import { Injectable } from '@nestjs/common';
import { Setting } from './entities/setting.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateSettingsDto } from './dto/setting-request.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting) private keyRepository: Repository<Setting>
  ) {}

  /**
   * Returns the settings for a user
   * @param user
   * @returns
   */
  async getSettings(user: string) {
    let settings = await this.keyRepository.findOne({ where: { user } });

    // If no settings exist, create a new one
    if (!settings) {
      settings = new Setting();
      settings.user = user;
      await this.keyRepository.save(settings);
    }

    return settings;
  }

  /**
   * Sets the settings for a user
   * @param sub
   * @param values
   * @returns
   */
  async setSettings(sub: string, values: UpdateSettingsDto) {
    const settings = await this.getSettings(sub);
    // Update values
    Object.assign(settings, values);

    // Save settings (update existing or insert new)
    return this.keyRepository.save(settings);
  }
}
