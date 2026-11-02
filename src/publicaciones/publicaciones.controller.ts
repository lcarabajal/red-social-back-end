import { Controller, Get, Post, Delete, Param, Query, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
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

  @Post()
  @UseInterceptors(FileInterceptor('imagen', { storage: multer.memoryStorage() }))
  crear(
    @Body() body: { texto: string; userId: string },
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.pubService.crear(body.texto, body.userId, file);
  }
}