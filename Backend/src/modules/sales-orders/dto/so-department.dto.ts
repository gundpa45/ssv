import {
  IsArray,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class SODepartmentDto {
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @IsArray()
  @IsString({ each: true })
  activityIds: string[];
}
