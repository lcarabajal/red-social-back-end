import { Controller, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service.js';
import { CreateAuthDto } from './dto/create-auth.dto.js';
import { LoginDto } from './dto/login.dto.js';
import * as multer from 'multer';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}