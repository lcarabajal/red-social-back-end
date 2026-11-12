import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Publicacion } from '../publicacion/entities/publicacion.entity.js';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Comentario } from '../publicacion/entities/comentario.entity.js';

@Injectable()
export class PublicacionesService {
  private supabase: SupabaseClient;
    
  constructor(@InjectModel(Publicacion.name) private pubModel: Model<Publicacion>,
  @InjectModel(Comentario.name) private comentarioModel: Model<Comentario>) {
    this.supabase = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_KEY || ''
      );
  }

  async obtenerComentarios(pubId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    return this.comentarioModel.find({ publicacion: new Types.ObjectId(pubId) })
      .sort({ fecha: -1 }) // Los más recientes primero
      .skip(skip)
      .limit(limit)
      .populate('usuario', 'username imagenPerfilUrl') // Traer datos del creador
      .exec();
  }

  async agregarComentario(pubId: string, userId: string, texto: string) {
    const nuevoComentario = new this.comentarioModel({
      texto,
      usuario: new Types.ObjectId(userId),
      publicacion: new Types.ObjectId(pubId)
    });
    await nuevoComentario.save();
    return nuevoComentario.populate('usuario', 'username imagenPerfilUrl');
  }

  async modificarComentario(comentarioId: string, texto: string) {
    const comentarioActualizado = await this.comentarioModel.findByIdAndUpdate(
      comentarioId,
      { 
        texto: texto,
        modificado: true // Marcamos que fue editado
      },
      { new: true } // Retorna el documento actualizado
    ).populate('usuario', 'username imagenPerfilUrl');

    if (!comentarioActualizado) throw new NotFoundException('Comentario no encontrado');
    return comentarioActualizado;
  }

  // Traer publicaciones paginadas y ordenadas
  async obtenerTodas(page: number, limit: number, sort: string) {
    const skip = (page - 1) * limit;
    
    // Si sort es 'likes', ordenamos por la cantidad de likes, si no, por fecha (createdAt)
    const ordenamiento: any = sort === 'likes' ? { likesCount: -1 } : { createdAt: -1 };

    return this.pubModel.find({activo:true})
      .sort(ordenamiento)
      .skip(skip)
      .limit(limit)
      .populate('usuario', 'nombre apellido username imagenPerfilUrl') // Traemos los datos del autor
      .exec();
  }
  
  async obtenerPorId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Formato de ID inválido');
    }

    const publicacion = await this.pubModel.findById(id)
      .populate('usuario', 'nombre apellido username imagenPerfilUrl');

    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    return publicacion;
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

  async darDeBaja(id: string) {
    // Cambiamos activo a false. 
    return this.pubModel.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );
  }
}