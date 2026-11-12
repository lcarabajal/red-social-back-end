import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

@Schema({ collection: 'publicacions', timestamps: true }) // createdAt funcionará como nuestra 'fecha'
export class Publicacion extends Document {
  @Prop()
  imagenUrl: string;
  
  @Prop({ required: true }) texto: string;
  
  // Referencia al ID del usuario que la creó
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true }) 
  usuario: Usuario;

  // Array con los IDs de los usuarios que dieron like
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Usuario' }], default: [] })
  likes: Types.ObjectId[];

  // Propiedad auxiliar para poder ordenar por cantidad de likes fácilmente en Mongo
  @Prop({ default: 0 }) 
  likesCount: number;

  @Prop({default: true})
  activo:boolean;

}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);