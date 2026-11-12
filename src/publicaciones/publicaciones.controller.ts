import { Controller, Get, Post, Delete, Param, Query, Body, UploadedFile, UseInterceptors, Put } from '@nestjs/common';
import { PublicacionesService } from './publicaciones.service.js';
import { FileInterceptor } from '@nestjs/platform-express';
import multer from 'multer';

@Controller('publicaciones')
export class PublicacionesController {
  constructor(private readonly pubService: PublicacionesService) {}

  @Get()
  getTodas(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('sort') sort: string = 'fecha'
  ) {
    return this.pubService.obtenerTodas(Number(page), Number(limit), sort);
  }
  
  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.pubService.obtenerPorId(id);
  }

  @Get('usuario/:id')
  getPorUsuario(
    @Param('id') id: string, 
    @Query('limit') limit: string = '3'
  ) {
    return this.pubService.obtenerPorUsuario(id, Number(limit));
  }

  @Post(':id/like')
  toggleLike(@Param('id') id: string, @Body('userId') userId: string) {
    return this.pubService.toggleLike(id, userId);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string, @Query('userId') userId: string) {
    return this.pubService.eliminar(id, userId);
  }

  @Put(':id/baja')
  darDeBaja(@Param('id') id: string) {
    return this.pubService.darDeBaja(id);
  }
  
  @Post()
  @UseInterceptors(FileInterceptor('imagen', { storage: multer.memoryStorage() }))
  crear(
    @Body() body: { texto: string; userId: string },
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.pubService.crear(body.texto, body.userId, file);
  }


  //Seccion comentarios
  @Get(':id/comentarios')
  obtenerComentarios(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5'
  ) {
    return this.pubService.obtenerComentarios(id, Number(page), Number(limit));
  }

  @Post(':id/comentarios')
  agregarComentario(
    @Param('id') id: string,
    @Body() body: { userId: string, texto: string }
  ) {
    return this.pubService.agregarComentario(id, body.userId, body.texto);
  }

  @Put('comentarios/:idComentario')
  modificarComentario(
    @Param('idComentario') idComentario: string,
    @Body('texto') texto: string
  ) {
    return this.pubService.modificarComentario(idComentario, texto);
  }
}