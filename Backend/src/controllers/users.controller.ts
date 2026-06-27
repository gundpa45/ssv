import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Patch,
  Delete,
  Req,
} from '@nestjs/common';

import { UsersService } from '../services/users.service';

import { CreateUserDto } from '../modules/users/dto/create-user.dto';

import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';

import { RolesGuard } from '../modules/auth/guards/roles.guard';

import { Roles } from '../modules/auth/decorators/roles.decorator';

import { UpdateUserDto } from '../modules/users/dto/update-user.dto';
import { ChangePasswordDto } from '../modules/users/dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles('Admin')

  @Post()
  async createUser(
    @Req() req: any,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.createUser(
      createUserDto,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUsers() {
    return this.usersService.getUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(
    @Param('id') id: string,
  ) {
    return this.usersService.getUserById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateUser(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(
      id,
      updateUserDto,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/change-password')
  async changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      id,
      changePasswordDto,
    );
  }

    @UseGuards(JwtAuthGuard, RolesGuard)

  @Roles('Admin')

  @Delete(':id')
  async deleteUser(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.usersService.deleteUser(
      id,
      req.user.userId,
    );
  }
}