import { ConflictException, Injectable } from '@nestjs/common';
import { TemplatesService } from './templates.interface';
import { ConfigService } from '@nestjs/config';
import {
  readFileSync,
  readdirSync,
  existsSync,
  writeFileSync,
  rmSync,
  mkdirSync,
} from 'fs';
import { join, normalize, sep } from 'path';
import { Template } from './dto/template.dto';

@Injectable()
export class TemplatesFileService implements TemplatesService {
  constructor(private configService: ConfigService) {
    //create the folder if it does not exist yet
    const folder = this.configService.get('CREDENTIALS_FOLDER');
    if (!existsSync(folder)) {
      mkdirSync(folder, {
        recursive: true,
      });
    }
  }

  listAll() {
    try {
      const fileNames = readdirSync(
        this.configService.get('CREDENTIALS_FOLDER')
      );
      const files = fileNames.map((file) =>
        JSON.parse(
          readFileSync(
            join(this.configService.get('CREDENTIALS_FOLDER'), file),
            'utf-8'
          )
        )
      );
      return Promise.resolve(files);
    } catch (error) {
      throw new ConflictException('Error reading files');
    }
  }
  async getOne(id: string) {
    const files = await this.listAll();
    const template = files.find((file) => file.request.id === id);
    if (!template) {
      throw new ConflictException('Template not found');
    }
    return template;
  }
  create(data: Template) {
    // escape potential path traversal attacks. This will not allow ids with /
    const safeId = normalize(data.request.id).split(sep).pop();
    //check if there is already a template with the same id. If so, throw an error because it needs to be updated
    if (
      existsSync(
        join(this.configService.get('CREDENTIALS_FOLDER'), `${safeId}.json`)
      )
    ) {
      throw new ConflictException('Template already exists');
    }
    //create the file
    writeFileSync(
      join(this.configService.get('CREDENTIALS_FOLDER'), `${safeId}.json`),
      JSON.stringify(data, null, 2)
    );
    return Promise.resolve(null);
  }

  update(id: string, data: Template) {
    const safeId = normalize(data.request.id).split(sep).pop();
    //check if the file exists
    if (
      existsSync(
        join(this.configService.get('CREDENTIALS_FOLDER'), `${safeId}.json`)
      )
    ) {
      //update the file
      writeFileSync(
        join(this.configService.get('CREDENTIALS_FOLDER'), `${safeId}.json`),
        JSON.stringify(data, null, 2)
      );
    }
    return Promise.resolve(null);
  }

  delete(id: string) {
    const safeId = normalize(id).split(sep).pop();
    //check if the file exists
    if (
      existsSync(
        join(this.configService.get('CREDENTIALS_FOLDER'), `${safeId}.json`)
      )
    ) {
      //delete the file
      rmSync(
        join(this.configService.get('CREDENTIALS_FOLDER'), `${safeId}.json`)
      );
    }
    return Promise.resolve(null);
  }
}
