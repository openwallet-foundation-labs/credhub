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
  const config = new DocumentBuilder()
    .setTitle('API')
    .setExternalDoc('json format', '/api-json')
    .setVersion('1.0')
    .addOAuth2({
      type: 'oauth2',
      flows: {
        clientCredentials: {
          tokenUrl: `${process.env.KEYCLOAK_AUTH_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
          authorizationUrl: `${process.env.KEYCLOAK_AUTH_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/auth`,
          refreshUrl: `${process.env.KEYCLOAK_AUTH_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
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
        clientId: process.env.KEYCLOAK_CLIENT_ID,
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
        realm: process.env.KEYCLOAK_REALM,
        scopes: [],
      },
    },
  });

  const configService = app.get(ConfigService);
  await app.listen(configService.get('PORT'));
}
bootstrap();
