import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateAuthDto {
  @IsString() 
  @IsNotEmpty() 
  nombre: string;

  @IsString() 
  @IsNotEmpty() 
  apellido: string;

  @IsEmail({}, { message: 'Correo inválido' }) 
  correo: string;

  @IsString() 
  @IsNotEmpty() 
  username: string;
  
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'La contraseña debe tener 8 caracteres, 1 mayúscula y 1 número'
  })
  password: string;

  @IsString() 
  @IsNotEmpty() 
  fechaNacimiento: string;

  @IsString() 
  @IsOptional() 
  descripcion?: string;
  // La imagen no va en el DTO porque llega como archivo (FileInterceptor)
}
