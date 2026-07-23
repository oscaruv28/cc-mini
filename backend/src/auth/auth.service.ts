import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly em: EntityManager,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.em.findOne(
      User,
      { email: dto.email },
      { populate: ['customer'] },
    );
    // Mismo mensaje para usuario inexistente o contraseña mala (no filtrar cuál falló).
    if (
      !user ||
      !user.passwordHash ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // customerId viaja en el token para aislar los datos por empresa.
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customer.id,
    };
    return {
      access_token: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
