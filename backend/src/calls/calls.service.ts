import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { Call } from './call.entity';
import { CallDirection } from './call.types';
import { User } from '../users/user.entity';
import { UserRole } from '../users/user.types';
import { Disposition } from '../catalog/disposition.entity';
import { InteractionStatus } from '../common/enums';
import { ALLOWED_TRANSITIONS, canTransition } from '../common/domain/interaction-status';
import { CreateCallDto } from './dto/create-call.dto';
import { ListCallsQueryDto } from './dto/list-calls-query.dto';
import { CallResponseDto, toCallResponse } from './dto/call-response.dto';
import { Paginated } from '../common/dto/paginated.dto';

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number): number =>
  min + Math.floor(Math.random() * (max - min + 1));

/**
 * Llamadas. Todas las operaciones están aisladas por `customerId` (empresa del
 * usuario autenticado): un usuario solo ve/afecta llamadas de agentes de su empresa.
 */
@Injectable()
export class CallsService {
  constructor(private readonly em: EntityManager) {}

  async create(dto: CreateCallDto, customerId: string): Promise<CallResponseDto> {
    const agent = await this.getAgent(dto.agentId, customerId);
    const call = new Call();
    call.agent = agent;
    call.direction = dto.direction;
    call.durationSec = dto.durationSec;
    call.phoneNumber = dto.phoneNumber;
    if (dto.openedAt) call.openedAt = new Date(dto.openedAt);
    await this.em.persistAndFlush(call);
    return toCallResponse(call);
  }

  async simulate(agentId: string, count: number, customerId: string) {
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
    id: string,
    next: InteractionStatus,
    customerId: string,
  ): Promise<CallResponseDto> {
    const call = await this.findOwned(id, customerId);
    if (!canTransition(call.status, next)) {
      throw new ConflictException(
        `Transición inválida: ${call.status} → ${next}. ` +
          `Permitidas desde ${call.status}: ${ALLOWED_TRANSITIONS[call.status].join(', ') || 'ninguna'}.`,
      );
    }
    call.status = next;
    if (next === InteractionStatus.RESOLVED) call.closedAt = new Date();
    await this.em.flush();
    return toCallResponse(call);
  }

  async setDisposition(
    id: string,
    dispositionId: string,
    customerId: string,
  ): Promise<CallResponseDto> {
    const call = await this.findOwned(id, customerId);
    const disposition = await this.em.findOne(Disposition, { id: dispositionId });
    if (!disposition) {
      throw new BadRequestException(`La tipificación ${dispositionId} no existe`);
    }
    call.disposition = disposition;
    await this.em.flush();
    return toCallResponse(call);
  }

  /** Detalle completo (con agente y tipificación poblados). */
  async findDetail(id: string, customerId: string): Promise<CallResponseDto> {
    const call = await this.em.findOne(
      Call,
      { id, agent: { customer: customerId } },
      { populate: ['agent', 'disposition'] },
    );
    if (!call) throw new NotFoundException(`No existe llamada con id ${id}`);
    return toCallResponse(call);
  }

  async list(query: ListCallsQueryDto, customerId: string): Promise<Paginated<CallResponseDto>> {
    const where: FilterQuery<Call> = { agent: { customer: customerId } };
    if (query.agentId) where.agent = { id: query.agentId, customer: customerId };
    if (query.status) where.status = query.status;

    if (query.from || query.to) {
      const range: Record<string, Date> = {};
      if (query.from) range.$gte = new Date(query.from);
      if (query.to) range.$lte = new Date(query.to);
      where.openedAt = range;
    }

    const { page, limit } = query;
    const [items, total] = await this.em.findAndCount(Call, where, {
      populate: ['agent', 'disposition'],
      limit,
      offset: (page - 1) * limit,
      orderBy: { openedAt: 'DESC' },
    });

    return {
      items: items.map(toCallResponse),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /** Busca la llamada por id restringida a la empresa (con agente y tipificación poblados). */
  private async findOwned(id: string, customerId: string): Promise<Call> {
    const call = await this.em.findOne(
      Call,
      { id, agent: { customer: customerId } },
      { populate: ['agent', 'disposition'] },
    );
    if (!call) throw new NotFoundException(`No existe llamada con id ${id}`);
    return call;
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
