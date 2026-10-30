import { PartialType } from '@nestjs/mapped-types';
import { CreatePublicacioneDto } from './create-publicacione.dto.js';

export class UpdatePublicacioneDto extends PartialType(CreatePublicacioneDto) {}
