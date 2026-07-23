import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { Ticket } from './ticket.entity';
import { Call } from '../calls/call.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user.types';
import { Disposition } from '../catalog/disposition.entity';
import { InteractionStatus } from '../common/enums';
import { ALLOWED_TRANSITIONS, canTransition } from '../common/domain/interaction-status';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { TicketResponseDto, toTicketResponse } from './dto/ticket-response.dto';
import { Paginated } from '../common/dto/paginated.dto';

/**
 * Tickets. Todas las operaciones están aisladas por `customerId` (empresa del
 * usuario autenticado): un usuario solo ve/afecta tickets de agentes de su empresa.
 */
@Injectable()
export class TicketsService {
  constructor(private readonly em: EntityManager) {}

  async create(dto: CreateTicketDto, customerId: string): Promise<TicketResponseDto> {
    const agent = await this.getAgent(dto.agentId, customerId);
    const ticket = new Ticket();
    ticket.agent = agent;
    ticket.subject = dto.subject;
    ticket.description = dto.description;
    if (dto.priority) ticket.priority = dto.priority;
    ticket.channel = dto.channel;
    if (dto.openedAt) ticket.openedAt = new Date(dto.openedAt);
    if (dto.callId) {
      const call = await this.em.findOne(Call, {
        id: dto.callId,
        agent: { customer: customerId },
      });
      if (!call) {
        throw new BadRequestException('La llamada relacionada no existe');
      }
      ticket.call = call;
    }
    await this.em.persistAndFlush(ticket);
    return toTicketResponse(ticket);
  }

  async changeStatus(
    id: string,
    next: InteractionStatus,
    customerId: string,
  ): Promise<TicketResponseDto> {
    const ticket = await this.findOwned(id, customerId);
    if (!canTransition(ticket.status, next)) {
      throw new ConflictException(
        `Transición inválida: ${ticket.status} → ${next}. ` +
          `Permitidas desde ${ticket.status}: ${ALLOWED_TRANSITIONS[ticket.status].join(', ') || 'ninguna'}.`,
      );
    }
    ticket.status = next;
    if (next === InteractionStatus.RESOLVED) ticket.closedAt = new Date();
    await this.em.flush();
    return toTicketResponse(ticket);
  }

  async setDisposition(
    id: string,
    dispositionId: string,
    customerId: string,
  ): Promise<TicketResponseDto> {
    const ticket = await this.findOwned(id, customerId);
    const disposition = await this.em.findOne(Disposition, { id: dispositionId });
    if (!disposition) {
      throw new BadRequestException(`La tipificación ${dispositionId} no existe`);
    }
    ticket.disposition = disposition;
    await this.em.flush();
    return toTicketResponse(ticket);
  }

  /** Detalle completo (con agente, tipificación y llamada relacionada poblados). */
  async findDetail(id: string, customerId: string): Promise<TicketResponseDto> {
    const ticket = await this.em.findOne(
      Ticket,
      { id, agent: { customer: customerId } },
      { populate: ['agent', 'disposition', 'call'] },
    );
    if (!ticket) throw new NotFoundException(`No existe ticket con id ${id}`);
    return toTicketResponse(ticket);
  }

  async list(
    query: ListTicketsQueryDto,
    customerId: string,
  ): Promise<Paginated<TicketResponseDto>> {
    const where: FilterQuery<Ticket> = { agent: { customer: customerId } };
    if (query.agentId) where.agent = { id: query.agentId, customer: customerId };
    if (query.status) where.status = query.status;

    if (query.from || query.to) {
      const range: Record<string, Date> = {};
      if (query.from) range.$gte = new Date(query.from);
      if (query.to) range.$lte = new Date(query.to);
      where.openedAt = range;
    }

    const { page, limit } = query;
    const [items, total] = await this.em.findAndCount(Ticket, where, {
      populate: ['agent', 'disposition', 'call'],
      limit,
      offset: (page - 1) * limit,
      orderBy: { openedAt: 'DESC' },
    });

    return {
      items: items.map(toTicketResponse),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /** Busca el ticket por id restringido a la empresa (con relaciones pobladas). */
  private async findOwned(id: string, customerId: string): Promise<Ticket> {
    const ticket = await this.em.findOne(
      Ticket,
      { id, agent: { customer: customerId } },
      { populate: ['agent', 'disposition', 'call'] },
    );
    if (!ticket) throw new NotFoundException(`No existe ticket con id ${id}`);
    return ticket;
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
