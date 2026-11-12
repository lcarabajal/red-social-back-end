import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors(); //Habilita la comunicación al frontEnd

  app.useGlobalPipes(new ValidationPipe()); //Habilita el uso de validators en el back

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
