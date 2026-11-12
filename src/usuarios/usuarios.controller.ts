import { Controller, Get, Post, Body, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsuariosService } from './usuarios.service.js';
import { AdminGuard } from '../auth/auth.guard.js';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('usuarios')
@UseGuards(AdminGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // Por GET: listado de usuarios
  @Get()
  listarUsuarios() {
    return this.usuariosService.obtenerTodos();
  }

  // Por POST: alta de un nuevo usuario (define perfil 'admin' o 'usuario')
  @Post()
  @UseInterceptors(FileInterceptor('imagen'))
  crearUsuario(
    @Body() datosUsuario: any,
    @UploadedFile() file: Express.Multer.File,
  ) 
  {
    return this.usuariosService.crearDesdeAdmin(datosUsuario, file);
  }

  // Por DELETE: permite deshabilitar a un usuario (Baja lógica)
  @Delete(':id')
  deshabilitarUsuario(@Param('id') id: string) {
    return this.usuariosService.cambiarEstadoActivo(id, false);
  }

  // Por POST: alta lógica, rehabilita a un usuario previamente deshabilitado
  @Post(':id/rehabilitar')
  rehabilitarUsuario(@Param('id') id: string) {
    return this.usuariosService.cambiarEstadoActivo(id, true);
  }
}
