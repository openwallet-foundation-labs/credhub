import { Module } from '@nestjs/common';
import { RelyingPartyManagerService } from './relying-party-manager.service';
import { SiopController } from './siop.controller';
import { ResolverModule } from '../../../../../libs/backend/src/lib/resolver/resolver.module';
import { HttpModule } from '@nestjs/axios';
import { TemplatesModule } from '../templates/templates.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthStateEntity } from './entity/auth-state.entity';

@Module({
  imports: [
    ResolverModule,
    HttpModule,
    TemplatesModule,
    TypeOrmModule.forFeature([AuthStateEntity]),
  ],
  controllers: [SiopController],
  providers: [RelyingPartyManagerService],
})
export class VerifierModule {}
