import 'tslib';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(['error', 'warn']);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  const configService = app.get<ConfigService>(ConfigService);

  const config = new DocumentBuilder()
    .setTitle('API')
    .setExternalDoc('json format', '/api-json')
    .setVersion('1.0')
    .addOAuth2({
      type: 'oauth2',
      flows: {
        password: {
          tokenUrl: `${configService.get(
            'OIDC_AUTH_URL'
          )}/realms/${configService.get(
            'OIDC_REALM'
          )}/protocol/openid-connect/token`,
          authorizationUrl: `${configService.get(
            'OIDC_AUTH_URL'
          )}/realms/${configService.get(
            'OIDC_REALM'
          )}/protocol/openid-connect/auth`,
          refreshUrl: `${configService.get(
            'OIDC_AUTH_URL'
          )}/realms/${configService.get(
            'OIDC_REALM'
          )}/protocol/openid-connect/token`,
          scopes: {},
        },
      },
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      initOAuth: {
        clientId: configService.get('OIDC_PUBLIC_CLIENT_ID'),
        realm: configService.get('OIDC_REALM'),
      },
      scopes: [],
    },
  });
  await app.listen(3000);
}
bootstrap();
