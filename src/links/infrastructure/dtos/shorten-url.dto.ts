import { ShortenUrlUseCase } from '@/links/application/usecases/shorten-url.usecase';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class ShortenUrlDto implements ShortenUrlUseCase.Input {
  @ApiProperty({ description: 'URL original que será encurtada' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;

  // @ApiProperty({
  //   description: 'ID do usuário dono do link (opcional)',
  //   required: false,
  // })
  // @IsString()
  // @IsOptional()
  // ownerId?: string;
}
