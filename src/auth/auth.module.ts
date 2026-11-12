import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import { Usuario, UsuarioSchema } from '../usuarios/entities/usuario.entity.js';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
    JwtModule.register({
      global:true,
      secret: process.env.JWT_SECRET || 'clave_super_secreta_jwt', 
      signOptions: { expiresIn: '15m' }, // Vence a los 15 minutos
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
