import { Module } from '@nestjs/common';
import { PublicacionesService } from './publicaciones.service.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Publicacion, PublicacionSchema } from '../publicacion/entities/publicacion.entity.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema }
    ])
  ],
  controllers: [PublicacionesController],
  providers: [PublicacionesService],
})
export class PublicacionesModule {}
