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
import { CredentialIssuerMetadataOptsV1_0_13 } from '@sphereon/oid4vci-common';
import { CredentialSchema } from '../issuer/types';

@Injectable()
export class TemplatesFileService extends TemplatesService {
  private folder: string;
  private credentialFolder: string;

  constructor(private configService: ConfigService) {
    super();
    //create the folder if it does not exist yet
    this.folder = this.configService.get('CREDENTIALS_FOLDER');
    this.credentialFolder = join(this.folder, 'credentials');
    if (!existsSync(this.credentialFolder)) {
      mkdirSync(this.folder, {
        recursive: true,
      });
    }
  }

  getMetadata(): Promise<CredentialIssuerMetadataOptsV1_0_13> {
    const content = JSON.parse(
      readFileSync(join(this.folder, 'metadata.json'), 'utf-8')
    ) as CredentialIssuerMetadataOptsV1_0_13;
    return Promise.resolve(content);
  }
  setMetadata(metadata: CredentialIssuerMetadataOptsV1_0_13): Promise<void> {
    writeFileSync(
      join(this.folder, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    return Promise.resolve(null);
  }

  listAll() {
    const files = readdirSync(this.credentialFolder);
    const credentials: Map<string, CredentialSchema> = new Map();
    for (const file of files) {
      //TODO: we should validate the schema
      const content = JSON.parse(
        readFileSync(join(this.credentialFolder, file), 'utf-8')
      ) as CredentialSchema;
      //check if an id is already used
      if (credentials.has(content.schema.id as string)) {
        throw new Error(
          `The credential with the id ${content.schema.id} is already used.`
        );
      }
      credentials.set(content.schema.id as string, content);
    }
    //transform map to object
    return Promise.resolve(credentials);
  }

  async getOne(id: string) {
    const files = await this.listAll();
    const template = files.get(id);
    if (!template) {
      throw new ConflictException('Template not found');
    }
    return template;
  }

  create(data: Template) {
    // escape potential path traversal attacks. This will not allow ids with /
    const safeId = normalize(data.schema.id as string)
      .split(sep)
      .pop();
    //check if there is already a template with the same id. If so, throw an error because it needs to be updated
    if (existsSync(join(this.credentialFolder, `${safeId}.json`))) {
      throw new ConflictException('Template already exists');
    }
    //create the file
    writeFileSync(
      join(this.credentialFolder, `${safeId}.json`),
      JSON.stringify(data, null, 2)
    );
    return Promise.resolve(null);
  }

  update(id: string, data: Template) {
    if (id !== data.schema.id) {
      throw new ConflictException(
        'The id in the data does not match the id in the url'
      );
    }
    const safeId = normalize(id).split(sep).pop();
    //check if the file exists
    if (!existsSync(join(this.credentialFolder, `${safeId}.json`))) {
      throw new ConflictException('Template does not exist');
    }
    //update the file
    writeFileSync(
      join(this.credentialFolder, `${safeId}.json`),
      JSON.stringify(data, null, 2)
    );

    return Promise.resolve(null);
  }

  delete(id: string) {
    const safeId = normalize(id).split(sep).pop();
    //check if the file exists
    if (existsSync(join(this.credentialFolder, `${safeId}.json`))) {
      //delete the file
      rmSync(join(this.credentialFolder, `${safeId}.json`));
    }
    return Promise.resolve(null);
  }
}
