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
import { Disposition } from '../entities/disposition.entity';
import { InteractionView } from '../entities/interaction-view.entity';
import {
  CallDirection,
  InteractionStatus,
  InteractionType,
  UserRole,
} from '../entities/enums';
import { CreateCallDto } from './dto/create-call.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListInteractionsQueryDto } from './dto/list-interactions-query.dto';
import { ALLOWED_TRANSITIONS, canTransition } from './interaction-status';

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number): number =>
  min + Math.floor(Math.random() * (max - min + 1));

/**
 * Todas las operaciones están aisladas por `customerId` (empresa del usuario
 * autenticado): un usuario solo ve/afecta interacciones de agentes de su empresa.
 */
@Injectable()
export class InteractionsService {
  constructor(private readonly em: EntityManager) {}

  async createCall(dto: CreateCallDto, customerId: string): Promise<Call> {
    const agent = await this.getAgent(dto.agentId, customerId);
    const call = new Call();
    call.agent = agent;
    call.direction = dto.direction;
    call.durationSec = dto.durationSec;
    call.phoneNumber = dto.phoneNumber;
    if (dto.openedAt) call.openedAt = new Date(dto.openedAt);
    await this.em.persistAndFlush(call);
    return call;
  }

  async createTicket(dto: CreateTicketDto, customerId: string): Promise<Ticket> {
    const agent = await this.getAgent(dto.agentId, customerId);
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

  async simulateCalls(agentId: string, count: number, customerId: string) {
    const agent = await this.getAgent(agentId, customerId);
    const dispositions = await this.em.find(Disposition, { active: true });

    const created: Call[] = [];
    for (let i = 0; i < count; i++) {
      const call = new Call();
      call.agent = agent;
      call.direction = Math.random() < 0.5 ? CallDirection.INBOUND : CallDirection.OUTBOUND;
      call.phoneNumber = '+57' + randInt(3000000000, 3299999999);

      const opened = new Date(Date.now() - randInt(0, 14 * 24 * 60 * 60) * 1000);
      call.openedAt = opened;
      const duration = randInt(20, 900);
      call.durationSec = duration;

      const roll = Math.random();
      if (roll < 0.7) {
        call.status = InteractionStatus.RESOLVED;
        call.closedAt = new Date(opened.getTime() + duration * 1000 + randInt(0, 60) * 1000);
        if (dispositions.length) call.disposition = pick(dispositions);
      } else if (roll < 0.9) {
        call.status = InteractionStatus.IN_PROGRESS;
      } else {
        call.status = InteractionStatus.OPEN;
      }

      this.em.persist(call);
      created.push(call);
    }
    await this.em.flush();
    return { created: created.length, ids: created.map((c) => c.id) };
  }

  async changeStatus(
    type: InteractionType,
    id: string,
    next: InteractionStatus,
    customerId: string,
  ): Promise<Call | Ticket> {
    const entity = await this.findByType(type, id, customerId);
    if (!canTransition(entity.status, next)) {
      throw new ConflictException(
        `Transición inválida: ${entity.status} → ${next}. ` +
          `Permitidas desde ${entity.status}: ${ALLOWED_TRANSITIONS[entity.status].join(', ') || 'ninguna'}.`,
      );
    }
    entity.status = next;
    if (next === InteractionStatus.RESOLVED) entity.closedAt = new Date();
    await this.em.flush();
    return entity;
  }

  async setDisposition(
    type: InteractionType,
    id: string,
    dispositionId: string,
    customerId: string,
  ): Promise<Call | Ticket> {
    const entity = await this.findByType(type, id, customerId);
    const disposition = await this.em.findOne(Disposition, { id: dispositionId });
    if (!disposition) {
      throw new BadRequestException(`La tipificación ${dispositionId} no existe`);
    }
    entity.disposition = disposition;
    await this.em.flush();
    return entity;
  }

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

  /** Detalle completo de una interacción (con agente y tipificación poblados). */
  async findDetail(
    type: InteractionType,
    id: string,
    customerId: string,
  ): Promise<Call | Ticket> {
    const where = { id, agent: { customer: customerId } } as FilterQuery<Call & Ticket>;
    const entity =
      type === InteractionType.CALL
        ? await this.em.findOne(Call, where, { populate: ['agent', 'disposition'] })
        : await this.em.findOne(Ticket, where, { populate: ['agent', 'disposition'] });
    if (!entity) {
      throw new NotFoundException(`No existe ${type.toLowerCase()} con id ${id}`);
    }
    return entity;
  }

  /** Busca la interacción por id y tipo, restringida a la empresa. */
  private async findByType(
    type: InteractionType,
    id: string,
    customerId: string,
  ): Promise<Call | Ticket> {
    const where = { id, agent: { customer: customerId } } as FilterQuery<Call & Ticket>;
    const entity =
      type === InteractionType.CALL
        ? await this.em.findOne(Call, where)
        : await this.em.findOne(Ticket, where);
    if (!entity) {
      throw new NotFoundException(`No existe ${type.toLowerCase()} con id ${id}`);
    }
    return entity;
  }

  /** Valida que el agente exista, sea AGENT y pertenezca a la empresa. */
  private async getAgent(agentId: string, customerId: string): Promise<User> {
    const agent = await this.em.findOne(User, { id: agentId, customer: customerId });
    if (!agent) {
      throw new BadRequestException(`El agente ${agentId} no existe en tu empresa`);
    }
    if (agent.role !== UserRole.AGENT) {
      throw new BadRequestException('El usuario asignado no tiene rol AGENT');
    }
    return agent;
  }
}
