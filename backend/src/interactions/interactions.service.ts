import { Injectable } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { InteractionView } from './interaction-view.entity';
import { ListInteractionsQueryDto } from './dto/list-interactions-query.dto';

/**
 * Read model unificado (SOLO LECTURA). Expone el timeline combinado de llamadas
 * y tickets leyendo de la vista `v_interaction`, sin unir tablas en cada consulta.
 * Toda la escritura vive en los módulos `calls` y `tickets`.
 *
 * Aislado por `customerId`: un usuario solo ve interacciones de agentes de su empresa.
 */
@Injectable()
export class InteractionsService {
  constructor(private readonly em: EntityManager) {}

  async list(query: ListInteractionsQueryDto, customerId: string) {
    const where: Record<string, unknown> = { customerId };
    if (query.agentId) where.agentId = query.agentId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;

    if (query.from || query.to) {
      const range: Record<string, Date> = {};
      if (query.from) range.$gte = new Date(query.from);
      if (query.to) range.$lte = new Date(query.to);
      where.openedAt = range;
    }

    const { page, limit } = query;
    const [items, total] = await this.em.findAndCount(
      InteractionView,
      where as FilterQuery<InteractionView>,
      { limit, offset: (page - 1) * limit, orderBy: { openedAt: 'DESC' } },
    );

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }
}
