import { Module } from '@nestjs/common';
import { RelyingPartyManagerService } from './relying-party-manager.service';
import { SiopController } from './siop.controller';
import { ResolverModule } from '../resolver/resolver.module';
import { HttpModule } from '@nestjs/axios';
import { TemplatesModule } from '../templates/templates.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthRequestStateEntity } from './entity/auth-request-state.entity';
import { AuthResponseStateEntity } from './entity/auth-response-state.entity';

@Module({
  imports: [
    ResolverModule,
    HttpModule,
    TemplatesModule,
    TypeOrmModule.forFeature([AuthRequestStateEntity, AuthResponseStateEntity]),
  ],
  controllers: [SiopController],
  providers: [RelyingPartyManagerService],
})
export class VerifierModule {}
