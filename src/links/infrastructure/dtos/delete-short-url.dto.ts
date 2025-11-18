import { DeleteShortUrlUseCase } from '@/links/application/usecases/delete-short-url.usecase';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteShortUrlDto implements Partial<DeleteShortUrlUseCase.Input> {
  @ApiProperty({ description: 'ID da URL encurtada a ser removida' })
  @IsString()
  @IsNotEmpty()
  id: string;
}
