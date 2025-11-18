import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  HttpCode,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { AuthGuard } from '@/auth/infrastructure/auth.guard';

import {
  ShortUrlPresenter,
  ShortUrlCollectionPresenter,
} from './presenters/short-url.presenter';
import { ShortenUrlPresenter } from './presenters/shorten-url.presenter';

import { ShortenUrlDto } from './dtos/shorten-url.dto';

import { ShortenUrlUseCase } from '@/links/application/usecases/shorten-url.usecase';
import { ListUserUrlsUseCase } from '@/links/application/usecases/list-user-urls.usecase';
import { UpdateShortUrlDestinationUseCase } from '@/links/application/usecases/update-short-url.usecase';
import { DeleteShortUrlUseCase } from '@/links/application/usecases/delete-short-url.usecase';
import { DeleteShortUrlDto } from './dtos/delete-short-url.dto';
import {
  UpdateShortUrlBodyDto,
  UpdateShortUrlParamsDto,
} from './dtos/update-short-url.dto';
import { RedirectByAliasUseCase } from '../application/usecases/redirect-by-alias.usecase';
import { RedirectUrlByAliasDto } from './dtos/redirect-url-by-alias.dto';
import { OptionalAuthGuard } from '@/auth/infrastructure/otional-auth.guard';

@ApiTags('urls')
@Controller('urls')
export class LinksController {
  @Inject(ShortenUrlUseCase.UseCase)
  private shortenUrlUseCase: ShortenUrlUseCase.UseCase;

  @Inject(RedirectByAliasUseCase.UseCase)
  private redirectUseCase: RedirectByAliasUseCase.UseCase;

  @Inject(ListUserUrlsUseCase.UseCase)
  private listUserUrlsUseCase: ListUserUrlsUseCase.UseCase;

  @Inject(UpdateShortUrlDestinationUseCase.UseCase)
  private updateShortUrlUseCase: UpdateShortUrlDestinationUseCase.UseCase;

  @Inject(DeleteShortUrlUseCase.UseCase)
  private deleteShortUrlUseCase: DeleteShortUrlUseCase.UseCase;

  // -----------------------------------------------------------
  //  POST /api/shorten — encurta URL (auth opcional)
  // -----------------------------------------------------------
  @ApiResponse({
    status: 201,
    schema: { $ref: getSchemaPath(ShortenUrlPresenter) },
  })
  @ApiResponse({
    status: 422,
    description: 'Corpo da requisição inválido',
  })
  @UseGuards(OptionalAuthGuard)
  @Post()
  async shorten(
    @Body() dto: ShortenUrlDto,
    @Req() req: Request & { user?: string },
  ) {
    const output = await this.shortenUrlUseCase.execute({
      ...dto,
      ownerId: req.user,
    });
    return new ShortenUrlPresenter(output);
  }

  // -----------------------------------------------------------
  //  GET /:alias — redireciona (público)
  // -----------------------------------------------------------
  @ApiResponse({
    status: 302,
    description: 'Redireciona para a URL original',
  })
  @ApiResponse({
    status: 404,
    description: 'Alias não encontrado',
  })
  @Get('/:alias')
  async redirect(@Param() params: RedirectUrlByAliasDto, @Res() res: Response) {
    const output = await this.redirectUseCase.execute({ alias: params.alias });

    return res.redirect(output.originalUrl);
  }

  // -----------------------------------------------------------
  //  GET /api/urls — lista URLs do usuário autenticado
  // -----------------------------------------------------------
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ShortUrlPresenter) },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Acesso não autorizado' })
  @ApiResponse({ status: 422, description: 'Query inválida' })
  @UseGuards(AuthGuard)
  @Get()
  async list(@Req() req: Request & { user: string }) {
    const output = await this.listUserUrlsUseCase.execute({
      userId: req.user,
    });
    const out = new ShortUrlCollectionPresenter(output);
    return out;
  }

  // -----------------------------------------------------------
  //  PATCH /api/urls/:id — atualizar URL (somente owner)
  // -----------------------------------------------------------
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    schema: { $ref: getSchemaPath(ShortUrlPresenter) },
  })
  @ApiResponse({ status: 404, description: 'URL não encontrada' })
  @ApiResponse({ status: 401, description: 'Acesso não autorizado' })
  @ApiResponse({
    status: 409,
    description: 'Tentativa de alterar URL de outro usuário',
  })
  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param() params: UpdateShortUrlParamsDto,
    @Req() req: Request & { user: string },
    @Body() dto: UpdateShortUrlBodyDto,
  ) {
    const output = await this.updateShortUrlUseCase.execute({
      id: params.id,
      userId: req.user,
      ...dto,
    });

    return new ShortUrlPresenter(output);
  }

  // -----------------------------------------------------------
  //  DELETE /api/urls/:id — soft delete
  // -----------------------------------------------------------
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: 'Excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'URL não encontrada' })
  @ApiResponse({ status: 401, description: 'Acesso não autorizado' })
  @UseGuards(AuthGuard)
  @HttpCode(204)
  @Delete(':id')
  async remove(
    @Param() params: DeleteShortUrlDto,
    @Req() req: Request & { user: string },
  ) {
    await this.deleteShortUrlUseCase.execute({
      id: params.id,
      userId: req.user,
    });
  }
}
