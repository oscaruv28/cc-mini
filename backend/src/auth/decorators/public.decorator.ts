import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca un endpoint como público (sin JWT) pese al guard global. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
