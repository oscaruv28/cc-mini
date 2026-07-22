import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { Call } from '../entities/call.entity';
import { Ticket } from '../entities/ticket.entity';
import { User } from '../entities/user.entity';
import { InteractionView } from '../entities/interaction-view.entity';
import { InteractionStatus, InteractionType, UserRole } from '../entities/enums';
import { CreateCallDto } from './dto/create-call.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListInteractionsQueryDto } from './dto/list-interactions-query.dto';

/** Transiciones de estado permitidas del ciclo de vida de una interacción. */
const ALLOWED_TRANSITIONS: Record<InteractionStatus, InteractionStatus[]> = {
  [InteractionStatus.OPEN]: [InteractionStatus.IN_PROGRESS],
  [InteractionStatus.IN_PROGRESS]: [InteractionStatus.RESOLVED],
  [InteractionStatus.RESOLVED]: [],
};

@Injectable()
export class InteractionsService {
  constructor(private readonly em: EntityManager) {}

  async createCall(dto: CreateCallDto): Promise<Call> {
    const agent = await this.getAgent(dto.agentId);
    const call = new Call();
    call.agent = agent;
    call.direction = dto.direction;
    call.durationSec = dto.durationSec;
    call.phoneNumber = dto.phoneNumber;
    if (dto.openedAt) call.openedAt = new Date(dto.openedAt);
    await this.em.persistAndFlush(call);
    return call;
  }

  async createTicket(dto: CreateTicketDto): Promise<Ticket> {
    const agent = await this.getAgent(dto.agentId);
    const ticket = new Ticket();
    ticket.agent = agent;
    ticket.subject = dto.subject;
    ticket.description = dto.description;
    if (dto.priority) ticket.priority = dto.priority;
    ticket.channel = dto.channel;
    if (dto.openedAt) ticket.openedAt = new Date(dto.openedAt);
    await this.em.persistAndFlush(ticket);
    return ticket;
  }

  async changeStatus(
    type: InteractionType,
    id: string,
    next: InteractionStatus,
  ): Promise<Call | Ticket> {
    const entity =
      type === InteractionType.CALL
        ? await this.em.findOne(Call, { id })
        : await this.em.findOne(Ticket, { id });

    if (!entity) {
      throw new NotFoundException(`No existe ${type.toLowerCase()} con id ${id}`);
    }

    if (!ALLOWED_TRANSITIONS[entity.status].includes(next)) {
      throw new ConflictException(
        `Transición inválida: ${entity.status} → ${next}. ` +
          `Permitidas desde ${entity.status}: ${ALLOWED_TRANSITIONS[entity.status].join(', ') || 'ninguna'}.`,
      );
    }

    entity.status = next;
    if (next === InteractionStatus.RESOLVED) {
      entity.closedAt = new Date();
    }
    await this.em.flush();
    return entity;
  }

  async list(query: ListInteractionsQueryDto) {
    const where: Record<string, unknown> = {};
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
      {
        limit,
        offset: (page - 1) * limit,
        orderBy: { openedAt: 'DESC' },
      },
    );

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /** Valida que el destinatario exista y sea un agente. */
  private async getAgent(agentId: string): Promise<User> {
    const agent = await this.em.findOne(User, { id: agentId });
    if (!agent) {
      throw new BadRequestException(`El agente ${agentId} no existe`);
    }
    if (agent.role !== UserRole.AGENT) {
      throw new BadRequestException('El usuario asignado no tiene rol AGENT');
    }
    return agent;
  }
}
