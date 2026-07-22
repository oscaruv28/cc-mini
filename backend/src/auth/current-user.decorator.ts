import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Payload del JWT adjuntado a la request por el JwtAuthGuard. */
export interface JwtUser {
  sub: string;
  email: string;
  role: string;
  customerId: string;
}

/** Inyecta el usuario autenticado (payload del token) en un handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser =>
    ctx.switchToHttp().getRequest<{ user: JwtUser }>().user,
);
