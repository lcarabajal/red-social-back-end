import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Publicacion } from '../publicacion/entities/publicacion.entity.js';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable()
export class PublicacionesService {
  private supabase: SupabaseClient;
    
  constructor(@InjectModel(Publicacion.name) private pubModel: Model<Publicacion>) {
    this.supabase = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_KEY || ''
      );
  }

  // Traer publicaciones paginadas y ordenadas
  async obtenerTodas(page: number, limit: number, sort: string) {
    const skip = (page - 1) * limit;
    
    // Si sort es 'likes', ordenamos por la cantidad de likes, si no, por fecha (createdAt)
    const ordenamiento: any = sort === 'likes' ? { likesCount: -1 } : { createdAt: -1 };

    return this.pubModel.find()
      .sort(ordenamiento)
      .skip(skip)
      .limit(limit)
      .populate('usuario', 'nombre apellido username imagenPerfilUrl') // Traemos los datos del autor
      .exec();
  }

  // Traer las últimas X publicaciones de un usuario específico
  async obtenerPorUsuario(usuarioId: string, limit: number) {
    return this.pubModel.find({ usuario: new Types.ObjectId(usuarioId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('usuario', 'nombre apellido username imagenPerfilUrl')
      .exec();
  }

  // Dar o quitar like
  async toggleLike(idPublicacion: string, userId: string) {
    const publicacion = await this.pubModel.findById(idPublicacion);
    if (!publicacion) throw new NotFoundException('Publicación no encontrada');

    const index = publicacion.likes.indexOf(new Types.ObjectId(userId));
    
    if (index === -1) {
      publicacion.likes.push(new Types.ObjectId(userId)); // Dar like
      publicacion.likesCount += 1;
    } else {
      publicacion.likes.splice(index, 1); // Quitar like
      publicacion.likesCount -= 1;
    }

    return publicacion.save();
  }

  // Eliminar publicación
  async eliminar(idPublicacion: string, userId: string) {
    // Solo permitimos borrar si el usuario coincide
    return this.pubModel.findOneAndDelete({ 
      _id: new Types.ObjectId(idPublicacion),
      usuario: new Types.ObjectId(userId)
    });
  }

  async crear(texto: string, userId: string, file?: Express.Multer.File) {
    // Validar formato de Mongo ID
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('El formato del ID de usuario es inválido');
    }
    
    let imagenUrl = null;

    if (file) {
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error } = await this.supabase.storage
        .from('publicaciones') 
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (!error) {
        imagenUrl = this.supabase.storage.from('publicaciones').getPublicUrl(fileName).data.publicUrl;
      }
    }

    const nuevaPublicacion = new this.pubModel({ 
      texto, 
      usuario: new Types.ObjectId(userId),
      imagenUrl // Se guarda si existe, sino queda null
    });

    await nuevaPublicacion.save();
    // Poblamos el usuario para devolver la publicación completa y que el front la muestre al instante
    return nuevaPublicacion.populate('usuario', 'nombre apellido username imagenPerfilUrl');
  }
}