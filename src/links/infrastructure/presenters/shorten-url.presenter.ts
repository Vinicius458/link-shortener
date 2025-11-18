import { LinkOutput } from '@/links/application/dtos/link-output';
import { ApiProperty } from '@nestjs/swagger';

export class ShortenUrlPresenter {
  @ApiProperty({ description: 'URL reduzida completa com domínio' })
  shortUrl: string;

  constructor(output: LinkOutput) {
    this.shortUrl = `${process.env.APP_BASE_URL}/urls/${output.shortCode}`;
  }
}
