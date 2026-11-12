import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/entities/usuario.entity.js';
import { CreateAuthDto } from './dto/create-auth.dto.js';
import { LoginDto } from './dto/login.dto.js';


import 'multer';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  //Esto solo funciona si tengo importados mi mongoo schema y mi jwtModule en mi imports de module
  constructor(@InjectModel(Usuario.name) private usuarioModel: Model<Usuario>, private jwtService: JwtService) {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
    );
  }
  // Generador central de tokens
  private generarToken(usuario: any) {
    const payload = { 
      sub: usuario._id, 
      correo: usuario.correo, 
      username: usuario.username,
      perfil: usuario.perfil || 'usuario' 
    };
    return this.jwtService.sign(payload);
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
      ...registroDto, //Datos del usuario desempaquetados
      password: hashedPassword, //contraseña encriptada
      imagenPerfilUrl: imagenUrl //imagen URL
    });

    const usuarioGuardado = await nuevoUsuario.save(); // Guarda el usuario en mongoDB
    
    const usuarioResponse = usuarioGuardado;
    const token = this.generarToken(usuarioResponse);

    return { usuario: usuarioResponse, token };
  }

  async login(loginDto: LoginDto) {
    // 1. Buscar usuario por correo o username
    const usuario = await this.usuarioModel.findOne({
      $or: [{ correo: loginDto.identificador }, { username: loginDto.identificador }]
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // NUEVO: Validación de baja lógica
    if (usuario.activo === false) {
      throw new UnauthorizedException('Tu cuenta ha sido deshabilitada. No estás autorizado para ingresar.');
    }

    // 2. Comparar contraseña plana con la encriptada en la DB
    const isPasswordValid = await bcrypt.compare(loginDto.password, usuario.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 3. Separamos la contraseña del para generar el JWT 
    const { password, ...usuarioObj } = usuario.toObject();

    
    const token = this.generarToken(usuarioObj);
   
    return { usuario: usuarioObj, token };
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

  async autorizar(token: string) {
    try {
      // Verifica si es válido y no está vencido
      const payload = this.jwtService.verify(token); 

      // Buscamos al usuario real en la base de datos
      const usuario = await this.usuarioModel.findById(payload.sub).select('-password');
      if (!usuario) throw new UnauthorizedException('Usuario no existe');
      
      return usuario;
    } catch (e) {
      throw new UnauthorizedException('Token inválido o vencido'); // Devuelve 401
    }
  }

  async refrescar(token: string) {
    try {
      // Verificamos el token actual
      const payload = this.jwtService.verify(token);

      // Generamos uno nuevo con el mismo payload (automáticamente le dará otros 15 min)
      const nuevoPayload = { sub: payload.sub, correo: payload.correo, username: payload.username, rol: payload.rol };
      return { token: this.jwtService.sign(nuevoPayload) };
    } catch (e) {
      throw new UnauthorizedException('Token inválido o vencido'); // 401
    }
  }
}