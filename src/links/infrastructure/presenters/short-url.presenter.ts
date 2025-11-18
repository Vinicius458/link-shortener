import { LinkOutput } from '@/links/application/dtos/link-output';
import { ListUserUrlsUseCase } from '@/links/application/usecases/list-user-urls.usecase';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ShortUrlPresenter {
  @ApiProperty({ description: 'Identificador único da URL encurtada' })
  id: string;

  @ApiProperty({
    description: 'Código curto (shortCode) usado na URL encurtada',
  })
  shortCode: string;

  @ApiProperty({ description: 'URL original de destino antes do encurtamento' })
  originalUrl: string;

  @ApiProperty({ description: 'Total de cliques registrados' })
  clicks: number;

  @ApiProperty({ description: 'Data de criação do registro (ISO 8601)' })
  @Transform(({ value }: { value: Date }) => value.toISOString())
  createdAt: Date;

  constructor(output: LinkOutput) {
    this.id = output.id;
    this.shortCode = `${process.env.APP_BASE_URL}/urls/${output.shortCode}`;
    this.originalUrl = output.originalUrl;
    this.clicks = output.clicks ?? 0;
    this.createdAt = output.createdAt;
  }
}

export class ShortUrlCollectionPresenter {
  data: ShortUrlPresenter[];

  constructor(output: ListUserUrlsUseCase.Output) {
    const { items } = output;
    this.data = items?.map(item => new ShortUrlPresenter(item));
  }
}
