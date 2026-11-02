import { Module } from '@nestjs/common';
import { PublicacionService } from './publicacion.service.js';
import { PublicacionController } from './publicacion.controller.js';

@Module({
  controllers: [PublicacionController],
  providers: [PublicacionService],
})
export class PublicacionModule {}
