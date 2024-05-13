import 'tslib';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

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
        password: {
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
  await app.listen(3000);
}
bootstrap();
