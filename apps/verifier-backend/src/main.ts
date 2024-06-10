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
          tokenUrl: `${process.env.OIDC_AUTH_URL}/realms/${process.env.OIDC_REALM}/protocol/openid-connect/token`,
          authorizationUrl: `${process.env.OIDC_AUTH_URL}/realms/${process.env.OIDC_REALM}/protocol/openid-connect/auth`,
          refreshUrl: `${process.env.OIDC_AUTH_URL}/realms/${process.env.OIDC_REALM}/protocol/openid-connect/token`,
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
        clientId: process.env.OIDC_CLIENT_ID,
        clientSecret: process.env.OIDC_CLIENT_SECRET,
        realm: process.env.OIDC_REALM,
        scopes: [],
      },
    },
  });

  const configService = app.get(ConfigService);
  await app.listen(configService.get('PORT'));
}
bootstrap();
