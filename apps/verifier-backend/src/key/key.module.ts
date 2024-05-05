import { Module } from '@nestjs/common';
import { KeyService } from './key.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [KeyService],
  exports: [KeyService],
})
export class KeyModule {}
