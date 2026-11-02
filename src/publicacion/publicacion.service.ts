import { Injectable } from '@nestjs/common';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { UpdatePublicacionDto } from './dto/update-publicacion.dto.js';

@Injectable()
export class PublicacionService {
  create(createPublicacionDto: CreatePublicacionDto) {
    return 'This action adds a new publicacion';
  }

  findAll() {
    return `This action returns all publicacion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} publicacion`;
  }

  update(id: number, updatePublicacionDto: UpdatePublicacionDto) {
    return `This action updates a #${id} publicacion`;
  }

  remove(id: number) {
    return `This action removes a #${id} publicacion`;
  }
}
