import { ConflictException, Injectable } from '@nestjs/common';
import { Template } from './dto/template.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TemplateEntity as TemplateEntity } from './schemas/temoplate.entity';
import { Repository } from 'typeorm';
import { CredentialConfigurationSupportedV1_0_13 } from '@sphereon/oid4vci-common';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CryptoService } from '@credhub/backend';

@Injectable()
export class TemplatesService {
  folder: string;
  constructor(
    @InjectRepository(TemplateEntity)
    private templateRepository: Repository<TemplateEntity>,
    private configSerivce: ConfigService,
    private cryptoService: CryptoService
  ) {
    this.folder = this.configSerivce.get('CREDENTIALS_FOLDER');
  }

  /**
   * Import templates for the local system when they are not already in the database. Do not overwrite existing templates.
   */
  async import() {
    const credentialFolder = join(this.folder, 'credentials');
    const files = readdirSync(credentialFolder);
    for (const file of files) {
      const template = plainToInstance(
        Template,
        JSON.parse(readFileSync(join(credentialFolder, file), 'utf-8'))
      );
      const errors = await validate(template);
      if (errors.length > 0) {
        console.error(JSON.stringify(errors, null, 2));
      } else {
        //check if an id is already used
        await this.templateRepository
          .findOneByOrFail({ name: template.name })
          .catch(async () => {
            await this.create(template);
          });
      }
    }
  }

  async getSupported() {
    const rec: Map<string, Template> = new Map();
    const elements = await this.templateRepository.find();
    elements.forEach((element) => rec.set(element.id, element.value));

    //iterate over the map and change the value
    const result: Record<string, CredentialConfigurationSupportedV1_0_13> = {};
    rec.forEach((v, k) => {
      v.schema.credential_signing_alg_values_supported =
        this.getSigningAlgValuesSupported();
      v.schema.cryptographic_binding_methods_supported =
        this.getCryptographicBindingMethodsSupported();
      result[k] = v.schema;
    });
    return result;
  }

  private getSigningAlgValuesSupported() {
    // we assume that we are only using one algorithm when issuing credentials
    return [this.cryptoService.getAlg()];
  }

  private getCryptographicBindingMethodsSupported() {
    return ['jwk'];
  }

  async listAll() {
    return this.templateRepository.find();
  }

  async getOne(id: string) {
    return this.templateRepository.findOneByOrFail({ id });
  }

  async create(value: Template) {
    await this.templateRepository
      .save(
        this.templateRepository.create({
          value,
          name: value.name,
        })
      )
      .catch((err) => {
        throw new ConflictException(err.message);
      });
  }

  async update(id: string, data: Template) {
    await this.templateRepository.update(
      { id },
      { value: data, name: data.name }
    );
  }

  async delete(id: string) {
    await this.templateRepository.delete({ id });
  }
}
