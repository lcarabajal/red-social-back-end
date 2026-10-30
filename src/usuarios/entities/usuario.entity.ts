import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Usuario extends Document {
  @Prop
  ({ required: true }) 
  nombre: string;

  @Prop
  ({ required: true }) 
  apellido: string;

  @Prop
  ({ required: true, unique: true })
   correo: string;

  @Prop
  ({ required: true, unique: true }) 
  username: string;

  @Prop
  ({ required: true }) 
  password: string; // Se guardará encriptada

  @Prop
  ({ required: true }) 
  fechaNacimiento: Date;

  @Prop
  () 
  descripcion: string;

  @Prop
  ({ required: true }) 
  imagenPerfilUrl: string;
  
  @Prop
  ({ default: 'usuario' })
  perfil: string;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);