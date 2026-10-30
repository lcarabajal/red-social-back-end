import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString() 
  @IsNotEmpty() 
  identificador: string; // Puede ser correo o username
  
  @IsString() 
  @IsNotEmpty() 
  password: string;
}