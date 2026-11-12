import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service.js';
import { AdminGuard } from '../auth/auth.guard.js';

@Controller('estadisticas')
@UseGuards(AdminGuard)
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  @Get()
  obtenerEstadisticas(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
  ) {
    return this.estadisticasService.obtenerResumen(inicio, fin);
  }
}