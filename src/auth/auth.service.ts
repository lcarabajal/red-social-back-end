import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { CreateAuthDto } from './dto/create-auth.dto.js';
import { LoginDto } from './dto/login.dto.js';

import { Express } from 'express';
import 'multer';

import { createClient, SupabaseClient } from '@supabase/supabase-js';


@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  
  constructor(@InjectModel(Usuario.name) private usuarioModel: Model<Usuario>) {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
    );
  }

  async registrar(registroDto: CreateAuthDto, file: Express.Multer.File) {
    // 1. Verificar si el usuario o correo ya existen
    const existe = await this.usuarioModel.findOne({
      $or: [{ correo: registroDto.correo }, { username: registroDto.username }]
    });
    if (existe) throw new BadRequestException('El correo o usuario ya está en uso');

    // 2. Encriptar la contraseña (Salt de 10 rondas)
    const hashedPassword = await bcrypt.hash(registroDto.password, 10);

    // 3. Guardar imagen apropiadamente
    const imagenUrl = await this.subirImagenASupabase(file);

    // 4. Crear y guardar el usuario
    const nuevoUsuario = new this.usuarioModel({
      ...registroDto,
      password: hashedPassword,
      imagenPerfilUrl: imagenUrl
    });

    const usuarioGuardado = await nuevoUsuario.save();
    
    // Convertimos a objeto y extraemos 'password', guardando el resto en 'usuarioResponse'
    const { password, ...usuarioResponse } = usuarioGuardado.toObject();

    return usuarioResponse;
  }

  async login(loginDto: LoginDto) {
    // 1. Buscar usuario por correo o username
    const usuario = await this.usuarioModel.findOne({
      $or: [{ correo: loginDto.identificador }, { username: loginDto.identificador }]
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 2. Comparar contraseña plana con la encriptada en la DB
    const isPasswordValid = await bcrypt.compare(loginDto.password, usuario.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 3. El requerimiento pide "devolver todos los datos del usuario"
    return usuario.toObject();
  }

  // --- Función auxiliar para simular la subida de imagen ---
  private async subirImagenASupabase(file: Express.Multer.File): Promise<string> {
    if (!file) throw new BadRequestException('La imagen de perfil es requerida');

    // Extraer extensión y crear nombre único (ej. 169123456-perfil.jpg)
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const bucket = 'perfiles'; 

    // 1. Subir el archivo desde el buffer de memoria
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype, // Asegura que se guarde como imagen, no como archivo binario
        upsert: false
      });

    if (error) {
      console.error('Error subiendo imagen a Supabase:', error);
      throw new InternalServerErrorException('No se pudo subir la imagen de perfil');
    }

    // 2. Generar y retornar la URL pública
    const { data: publicUrlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  }
}