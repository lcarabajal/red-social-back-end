import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';
import { Publicacion } from './publicacion.entity.js';

@Schema({ timestamps: { createdAt: 'fecha', updatedAt: false } }) // Mapea createdAt a 'fecha'
export class Comentario extends Document {
  @Prop({ required: true }) texto: string;
  
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) 
  usuario: Usuario;

  @Prop({ type: Types.ObjectId, ref: 'Publicacion', required: true }) 
  publicacion: Publicacion;

  @Prop({ default: false }) 
  modificado: boolean;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);