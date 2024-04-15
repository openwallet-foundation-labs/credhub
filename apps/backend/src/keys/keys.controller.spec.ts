import { Test, type TestingModule } from '@nestjs/testing';
import { KeysController } from './keys.controller';
import { KeysService } from './keys.service';

describe('KeysController', () => {
  let controller: KeysController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KeysController],
      providers: [KeysService],
    }).compile();

    controller = module.get<KeysController>(KeysController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
