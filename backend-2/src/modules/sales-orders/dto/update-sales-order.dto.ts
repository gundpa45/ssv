import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';

import { SODepartmentDto } from './so-department.dto';

export class UpdateSalesOrderDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  soNumber?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  customerName?: string;

  @IsOptional()
  @IsString()
  projectName?: string;

  @IsOptional()
  @IsString()
  soDescription?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SODepartmentDto)
  departments?: SODepartmentDto[];
}
