import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario } from './entities/usuario.entity.js';
import * as bcrypt from 'bcrypt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class UsuariosService {
  private supabase: SupabaseClient;
  constructor(
  @InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );
  }

  async obtenerTodos() {
    return this.usuarioModel.find().select('-password').exec();
  }

  async crearDesdeAdmin(datos: any, file?: Express.Multer.File) {
    const existe = await this.usuarioModel.findOne({
      $or: [{ username: datos.username }, { correo: datos.correo }],
    });
    if (existe) {
      throw new BadRequestException('El nombre de usuario o correo ya existe');
    }

    // 1. Subir la imagen a Supabase si el admin adjuntó un archivo
    let imagenPerfilUrl = '';
    if (file) {
      const extension = file.originalname.split('.').pop();
      const nombreArchivo = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${extension}`;

      const { error } = await this.supabase.storage
        .from('perfiles') // Tu bucket en Supabase
        .upload(nombreArchivo, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        throw new BadRequestException('Error al subir la imagen de perfil a Supabase');
      }

      const { data } = this.supabase.storage
        .from('perfiles')
        .getPublicUrl(nombreArchivo);

      imagenPerfilUrl = data.publicUrl;
    }

    // 2. Encriptar contraseña y guardar usuario completo
    const hashedPassword = await bcrypt.hash(datos.password, 10);
    const nuevoUsuario = new this.usuarioModel({
      nombre: datos.nombre,
      apellido: datos.apellido,
      correo: datos.correo,
      username: datos.username,
      password: hashedPassword,
      fechaNacimiento: datos.fechaNacimiento,
      descripcion: datos.descripcion,
      perfil: datos.perfil || 'usuario',
      imagenPerfilUrl,
      activo: true,
    });

    const guardado = await nuevoUsuario.save();
    const { password, ...resultado } = guardado.toObject();
    return resultado;
  }

  async cambiarEstadoActivo(id: string, estado: boolean) {
    const usuario = await this.usuarioModel
      .findByIdAndUpdate(id, { activo: estado }, { new: true })
      .select('-password');

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }
}
