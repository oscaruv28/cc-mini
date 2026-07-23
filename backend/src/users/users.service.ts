import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { FilterQuery } from '@mikro-orm/core';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { Customer } from '../catalog/customer.entity';
import { AgentAvailability } from '../catalog/agent-availability.entity';
import { UserRole } from './user.types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

/** Todas las operaciones están aisladas a la empresa (`customerId`) del token. */
@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  async create(dto: CreateUserDto, customerId: string): Promise<User> {
    if (await this.em.findOne(User, { email: dto.email })) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }
    const user = this.em.create(User, {
      name: dto.name,
      email: dto.email,
      role: dto.role,
      customer: this.em.getReference(Customer, customerId),
      passwordHash: await bcrypt.hash(dto.password, 10),
      createdAt: new Date(),
    });
    await this.em.flush();
    return user;
  }

  async findAll(query: ListUsersQueryDto, customerId: string) {
    const where: Record<string, unknown> = { customer: customerId };
    if (query.role) where.role = query.role;

    const { page, limit } = query;
    const [items, total] = await this.em.findAndCount(
      User,
      where as FilterQuery<User>,
      {
        limit,
        offset: (page - 1) * limit,
        orderBy: { createdAt: 'DESC' },
        populate: ['customer', 'availability'],
      },
    );
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string, customerId: string): Promise<User> {
    const user = await this.em.findOne(
      User,
      { id, customer: customerId },
      { populate: ['customer', 'availability'] },
    );
    if (!user) throw new NotFoundException(`No existe el usuario ${id}`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto, customerId: string): Promise<User> {
    const user = await this.findOne(id, customerId);
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.password !== undefined) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    await this.em.flush();
    return user;
  }

  async setAvailability(id: string, availabilityId: string, customerId: string): Promise<User> {
    const user = await this.findOne(id, customerId);
    if (user.role !== UserRole.AGENT) {
      throw new BadRequestException('Solo los agentes tienen disponibilidad');
    }
    const availability = await this.em.findOne(AgentAvailability, { id: availabilityId });
    if (!availability) {
      throw new BadRequestException(`La disponibilidad ${availabilityId} no existe`);
    }
    user.availability = availability;
    await this.em.flush();
    return user;
  }

  async remove(id: string, customerId: string): Promise<void> {
    const user = await this.findOne(id, customerId);
    try {
      await this.em.removeAndFlush(user);
    } catch {
      throw new ConflictException(
        'No se puede eliminar: el usuario tiene interacciones asociadas',
      );
    }
  }
}
