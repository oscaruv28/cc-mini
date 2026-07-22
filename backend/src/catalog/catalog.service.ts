import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Customer } from '../entities/customer.entity';
import { Disposition } from '../entities/disposition.entity';
import { AgentAvailability } from '../entities/agent-availability.entity';
import { UserRole } from '../entities/enums';

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
