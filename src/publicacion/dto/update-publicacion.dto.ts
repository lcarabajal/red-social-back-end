import { PartialType } from '@nestjs/mapped-types';
import { CreatePublicacionDto } from './create-publicacion.dto.js';

export class UpdatePublicacionDto extends PartialType(CreatePublicacionDto) {}
