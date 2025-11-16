import { CreateShortUrlUseCase } from '@/links/application/usecases/create-short-url.usecase';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateShortUrlDto implements CreateShortUrlUseCase.Input {
  // @ApiProperty({ description: 'E-mail do usuário' })
  // @IsString()
  // @IsNotEmpty()
  // @IsEmail()
  // email: string;
  // @ApiProperty({ description: 'Senha do usuário' })
  // @IsString()
  // @IsNotEmpty()
  // password: string;
}
