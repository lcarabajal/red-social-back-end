import { Module } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service.js';
import { EstadisticasController } from './estadisticas.controller.js';
import { Comentario, ComentarioSchema } from '../publicacion/entities/comentario.entity.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Publicacion, PublicacionSchema } from '../publicacion/entities/publicacion.entity.js';

@Module({
  imports:[
    MongooseModule.forFeature([
      { name: Comentario.name, schema: ComentarioSchema },
      { name: Publicacion.name, schema: PublicacionSchema } 
    ])
  ]
  ,
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
})
export class EstadisticasModule {}
