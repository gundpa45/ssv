import {
  IsArray,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { SODepartmentDto } from './so-department.dto';

export class UpdateSODepartmentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SODepartmentDto)
  departments: SODepartmentDto[];
}
