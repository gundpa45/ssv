import { PartialType } from '@nestjs/mapped-types';
import { CreateActivityLogDto } from './create-activity-log.dto';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateActivityLogDto extends PartialType(CreateActivityLogDto) {
  @IsOptional()
  @IsString()
  managerRemarks?: string;

  @IsOptional()
  @IsBoolean()
  isRework?: boolean;

  @IsOptional()
  @IsString()
  reworkAssignedToId?: string;
}
