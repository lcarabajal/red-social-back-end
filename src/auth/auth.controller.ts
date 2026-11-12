import { Controller, Post, Body, UploadedFile, UseInterceptors, UnauthorizedException, Headers, Get, Param, Put, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service.js';
import { CreateAuthDto } from './dto/create-auth.dto.js';
import { LoginDto } from './dto/login.dto.js';
import * as multer from 'multer';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario } from '../usuarios/entities/usuario.entity.js';

@Controller('auth')
export class AuthController {
  constructor(@InjectModel(Usuario.name) private usuarioModel: Model<Usuario>, private readonly authService: AuthService ) {}

  private extraerToken(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }
    return authHeader.split(' ')[1];
  }
  
  @Post('registro')
  // Usamos memoryStorage porque Vercel no permite escritura en disco duro
  @UseInterceptors(FileInterceptor('imagenPerfil', { storage: multer.memoryStorage() }))
  async registro(
    @Body() registroDto: CreateAuthDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.authService.registrar(registroDto, file);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('autorizar')
  autorizar(@Headers('authorization') authHeader: string) {
    const token = this.extraerToken(authHeader);
    return this.authService.autorizar(token);
  }

  @Post('refrescar')
  refrescar(@Headers('authorization') authHeader: string) {
    const token = this.extraerToken(authHeader);
    return this.authService.refrescar(token);
  }
  
  // 1. Traer TODOS los usuarios (activos e inactivos)
  @Get('usuarios')
  obtenerTodos() {
    return this.usuarioModel.find(); 
  }
}