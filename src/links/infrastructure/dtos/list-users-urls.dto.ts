import { ListUserUrlsUseCase } from '@/links/application/usecases/list-user-urls.usecase';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ListUserUrlsDto implements ListUserUrlsUseCase.Input {
  @ApiProperty({ description: 'ID do usuário para listar suas URLs' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
