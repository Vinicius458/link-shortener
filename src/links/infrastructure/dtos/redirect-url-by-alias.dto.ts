import { RedirectByAliasUseCase } from '@/links/application/usecases/redirect-by-alias.usecase';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RedirectUrlByAliasDto implements RedirectByAliasUseCase.Input {
  @ApiProperty({ description: 'Alias da URL encurtada' })
  @IsString()
  @IsNotEmpty()
  alias: string;
}
