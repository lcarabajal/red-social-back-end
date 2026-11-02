import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PublicacionService } from './publicacion.service.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { UpdatePublicacionDto } from './dto/update-publicacion.dto.js';

//ESTOY 99% SEGURO QUE TODO ESTO NO LO NECESITO!!!!!!!!!!!!!!!!!!!!!!!
@Controller('publicacion')
export class PublicacionController {
  constructor(private readonly publicacionService: PublicacionService) {}

  @Post()
  create(@Body() createPublicacionDto: CreatePublicacionDto) {
    return this.publicacionService.create(createPublicacionDto);
  }

  @Get()
  findAll() {
    return this.publicacionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.publicacionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePublicacionDto: UpdatePublicacionDto) {
    return this.publicacionService.update(+id, updatePublicacionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.publicacionService.remove(+id);
  }
}
