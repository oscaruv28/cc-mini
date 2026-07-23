import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import type { Request, Response } from 'express';

/**
 * Filtro global: da una respuesta de error consistente y loguea lo inesperado.
 * - HttpException (400/401/404/409…): conserva su estado y mensaje.
 * - Violación de restricción única (MikroORM) → 409.
 * - Cualquier otra cosa → 500 (se loguea con stack; no se filtra el detalle).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string'
          ? body
          : ((body as { message?: string | string[] }).message ?? exception.message);
    } else if (exception instanceof UniqueConstraintViolationException) {
      status = HttpStatus.CONFLICT;
      message = 'El recurso ya existe (restricción única)';
    }

    // Solo lo inesperado (5xx) se loguea con stack; los 4xx son errores de negocio.
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${req.method} ${req.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(status).json({
      statusCode: status,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
