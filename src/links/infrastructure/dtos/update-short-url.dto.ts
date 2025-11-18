import { UpdateShortUrlDestinationUseCase } from '@/links/application/usecases/update-short-url.usecase';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UpdateShortUrlParamsDto
  implements Partial<UpdateShortUrlDestinationUseCase.Input>
{
  @ApiProperty({ description: 'ID da URL encurtada a ser atualizada' })
  @IsString()
  @IsNotEmpty()
  id: string;
}
export class UpdateShortUrlBodyDto
  implements Partial<UpdateShortUrlDestinationUseCase.Input>
{
  @ApiProperty({ description: 'Nova URL de destino' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  newOriginalUrl: string;
}
