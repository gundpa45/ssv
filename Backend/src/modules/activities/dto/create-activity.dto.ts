import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  activityName: string;

  @IsInt()
  @Min(1)
  standardManMinutes: number;

  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @IsOptional()
  @IsString()
  restrictedRoleId?: string;
}