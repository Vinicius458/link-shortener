import { ClassValidatorFields } from '@/shared/domain/validators/class-validator-fields';
import { LinkProps } from '../entities/link.entity';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
} from 'class-validator';

export class LinkRules {
  @IsUrl()
  @IsNotEmpty()
  originalUrl: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 6)
  shortCode: string;

  @IsOptional()
  @IsString()
  ownerId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  clicks?: number;

  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @IsOptional()
  @IsDate()
  updatedAt?: Date;

  @IsOptional()
  @IsDate()
  deletedAt?: Date | null;

  constructor({
    originalUrl,
    shortCode,
    ownerId,
    clicks,
    createdAt,
    updatedAt,
    deletedAt,
  }: LinkProps) {
    Object.assign(this, {
      originalUrl,
      shortCode,
      ownerId,
      clicks,
      createdAt,
      updatedAt,
      deletedAt,
    });
  }
}

export class LinkValidator extends ClassValidatorFields<LinkRules> {
  validate(data: LinkRules): boolean {
    return super.validate(new LinkRules(data ?? ({} as LinkProps)));
  }
}

export class LinkValidatorFactory {
  static create(): LinkValidator {
    return new LinkValidator();
  }
}
