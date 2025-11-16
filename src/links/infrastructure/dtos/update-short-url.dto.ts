import { UpdateShortUrlDestinationUseCase } from '@/links/application/usecases/update-short-url.usecase';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UpdateShortUrlDestinationDto
  implements UpdateShortUrlDestinationUseCase.Input
{
  @ApiProperty({ description: 'ID da URL encurtada a ser atualizada' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'ID do usuário proprietário da URL' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Nova URL de destino' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  newOriginalUrl: string;
}
