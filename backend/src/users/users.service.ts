import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { FilterQuery } from '@mikro-orm/core';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { Customer } from '../entities/customer.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  async create(dto: CreateUserDto): Promise<User> {
    const customer = await this.em.findOne(Customer, { id: dto.customerId });
    if (!customer) {
      throw new BadRequestException(`El cliente ${dto.customerId} no existe`);
    }
    if (await this.em.findOne(User, { email: dto.email })) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const user = this.em.create(User, {
      name: dto.name,
      email: dto.email,
      role: dto.role,
      customer,
      passwordHash: await bcrypt.hash(dto.password, 10),
      createdAt: new Date(),
    });
    await this.em.flush();
    return user;
  }

  async findAll(query: ListUsersQueryDto) {
    const where: Record<string, unknown> = {};
    if (query.role) where.role = query.role;
    if (query.customerId) where.customer = query.customerId;

    const { page, limit } = query;
    const [items, total] = await this.em.findAndCount(
      User,
      where as FilterQuery<User>,
      {
        limit,
        offset: (page - 1) * limit,
        orderBy: { createdAt: 'DESC' },
        populate: ['customer'],
      },
    );
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.em.findOne(User, { id }, { populate: ['customer'] });
    if (!user) throw new NotFoundException(`No existe el usuario ${id}`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.password !== undefined) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    await this.em.flush();
    return user;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    try {
      await this.em.removeAndFlush(user);
    } catch {
      // FK: el usuario es agente de llamadas/tickets existentes.
      throw new ConflictException(
        'No se puede eliminar: el usuario tiene interacciones asociadas',
      );
    }
  }
}
