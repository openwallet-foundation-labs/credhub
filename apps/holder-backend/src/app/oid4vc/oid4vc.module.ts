import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { Oid4vciController } from './oid4vci/oid4vci.controller';
import { Oid4vciService } from './oid4vci/oid4vci.service';
import { Oid4vpController } from './oid4vp/oid4vp.controller';
import { Oid4vpService } from './oid4vp/oid4vp.service';
import { CredentialsModule } from '../credentials/credentials.module';
import { HistoryModule } from '../history/history.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, CredentialsModule, HistoryModule, AuthModule],
  controllers: [Oid4vciController, Oid4vpController],
  providers: [Oid4vciService, Oid4vpService],
})
export class Oid4vcModule {}
