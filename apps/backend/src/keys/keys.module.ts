import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Key } from './entities/key.entity';
import { KeysController } from './keys.controller';
import { KeysService } from './keys.service';

@Module({
  imports: [TypeOrmModule.forFeature([Key])],
  controllers: [KeysController],
  providers: [KeysService],
  exports: [KeysService],
})
export class KeysModule {}
