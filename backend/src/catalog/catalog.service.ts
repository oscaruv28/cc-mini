import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Customer } from './customer.entity';
import { Disposition } from './disposition.entity';
import { AgentAvailability } from './agent-availability.entity';
import { UserRole } from '../users/user.types';

@Injectable()
export class CatalogService {
  constructor(private readonly em: EntityManager) {}

  getRoles(): string[] {
    return Object.values(UserRole);
  }

  getCustomers() {
    return this.em.find(Customer, {}, { orderBy: { name: 'ASC' } });
  }

  getDispositions() {
    return this.em.find(Disposition, { active: true }, { orderBy: { code: 'ASC' } });
  }

  getAvailabilities() {
    return this.em.find(AgentAvailability, { active: true }, { orderBy: { code: 'ASC' } });
  }
}
