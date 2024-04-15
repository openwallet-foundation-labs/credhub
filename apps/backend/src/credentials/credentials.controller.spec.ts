import { Test, type TestingModule } from '@nestjs/testing';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';

describe('CredentialsController', () => {
  let controller: CredentialsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CredentialsController],
      providers: [CredentialsService],
    }).compile();

    controller = module.get<CredentialsController>(CredentialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
