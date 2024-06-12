import 'tslib';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(['error', 'warn']);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  const configService = app.get(ConfigService);

  const config = new DocumentBuilder()
    .setTitle('API')
    .setExternalDoc('json format', '/api-json')
    .setVersion('1.0')
    .addOAuth2({
      type: 'oauth2',
      flows: {
        clientCredentials: {
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
        clientId: configService.get('OIDC_CLIENT_ID'),
        clientSecret: configService.get('OIDC_CLIENT_SECRET'),
        realm: configService.get('OIDC_REALM'),
      },
      scopes: [],
    },
  });

  await app.listen(configService.get('PORT'));
}
bootstrap();
