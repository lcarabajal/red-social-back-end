import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Publicacion } from '../publicacion/entities/publicacion.entity.js';
import { Comentario } from '../publicacion/entities/comentario.entity.js';

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectModel(Publicacion.name) private readonly pubModel: Model<Publicacion>,
    @InjectModel(Comentario.name) private readonly comModel: Model<Comentario>,
  ) {}

async obtenerResumen(inicio: string, fin: string) {
    // 1. Armamos el rango horario en hora local para cubrir todo el día de inicio a fin
    const fechaInicio = inicio 
      ? new Date(`${inicio}T00:00:00.000`) 
      : new Date(0);

    const fechaFin = fin 
      ? new Date(`${fin}T23:59:59.999`) 
      : new Date();

    // 2. Ejecutamos las 3 consultas en paralelo
    const [pubsPorUsuario, comentariosPorDia, comentariosPorPub] = await Promise.all([
      this.getPublicacionesPorUsuario(fechaInicio, fechaFin),
      this.getComentariosPorDia(fechaInicio, fechaFin),
      this.getComentariosPorPublicacion(fechaInicio, fechaFin),
    ]);

    return {
      pubsPorUsuario,
      comentariosPorDia,
      comentariosPorPub,
    };
  }

  // --- GRÁFICO 1: Publicaciones por usuario (Usa 'createdAt') ---
  private async getPublicacionesPorUsuario(fechaInicio: Date, fechaFin: Date) {
    return this.pubModel.aggregate([
      {
        $match: {
          createdAt: { $gte: fechaInicio, $lte: fechaFin },
        },
      },
      {
        $group: {
          _id: '$usuario',
          cantidad: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'datosUsuario',
        },
      },
      {
        $unwind: {
          path: '$datosUsuario',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          nombre: { $ifNull: ['$datosUsuario.username', 'Usuario eliminado'] },
          cantidad: 1,
        },
      },
    ]);
  }

  // --- GRÁFICO 2: Comentarios en el tiempo (Usa 'fecha') ---
  private async getComentariosPorDia(fechaInicio: Date, fechaFin: Date) {
    return this.comModel.aggregate([
      {
        $match: {
          fecha: { $gte: fechaInicio, $lte: fechaFin },
        },
      },
      {
        $group: {
          _id: {
            // timezone asegura que agrupe los días según la hora de Argentina y no UTC
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$fecha',
              timezone: 'America/Argentina/Buenos_Aires'
            },
          },
          cantidad: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
  }

  // --- GRÁFICO 3: Comentarios por publicación (Usa 'fecha') ---
  private async getComentariosPorPublicacion(fechaInicio: Date, fechaFin: Date) {
    return this.comModel.aggregate([
      {
        $match: {
          fecha: { $gte: fechaInicio, $lte: fechaFin },
        },
      },
      {
        $group: {
          _id: '$publicacion',
          cantidad: { $sum: 1 },
        },
      },
      {
        $sort: { cantidad: -1 },
      },
      {
        $limit: 10,
      },
      // Opcional: Traemos el título o texto de la publicación para que el gráfico de torta sea más descriptivo que un ID
      {
        $lookup: {
          from: 'publicacions',
          localField: '_id',
          foreignField: '_id',
          as: 'datosPub',
        },
      },
      {
        $unwind: {
          path: '$datosPub',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          titulo: { $ifNull: ['$datosPub.titulo', '$datosPub.texto'] },
          cantidad: 1,
        },
      },
    ]);
  }
}