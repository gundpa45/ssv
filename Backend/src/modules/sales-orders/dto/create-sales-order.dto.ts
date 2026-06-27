import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';

import { SODepartmentDto } from './so-department.dto';

export class CreateSalesOrderDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toUpperCase())
  soNumber: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toUpperCase())
  customerName: string;

  @IsOptional()
  @IsString()
  projectName?: string;

  @IsOptional()
  @IsString()
  soDescription?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SODepartmentDto)
  departments?: SODepartmentDto[];
}