import { InteractionStatus } from '../enums';
import { canTransition } from './interaction-status';

describe('máquina de estados de interacción', () => {
  it('permite el avance secuencial', () => {
    expect(canTransition(InteractionStatus.OPEN, InteractionStatus.IN_PROGRESS)).toBe(true);
    expect(canTransition(InteractionStatus.IN_PROGRESS, InteractionStatus.RESOLVED)).toBe(true);
  });

  it('rechaza saltar pasos (OPEN → RESOLVED)', () => {
    expect(canTransition(InteractionStatus.OPEN, InteractionStatus.RESOLVED)).toBe(false);
  });

  it('rechaza retroceder', () => {
    expect(canTransition(InteractionStatus.IN_PROGRESS, InteractionStatus.OPEN)).toBe(false);
    expect(canTransition(InteractionStatus.RESOLVED, InteractionStatus.IN_PROGRESS)).toBe(false);
  });

  it('rechaza quedarse en el mismo estado', () => {
    expect(canTransition(InteractionStatus.OPEN, InteractionStatus.OPEN)).toBe(false);
  });

  it('una interacción resuelta no admite más transiciones', () => {
    expect(canTransition(InteractionStatus.RESOLVED, InteractionStatus.OPEN)).toBe(false);
    expect(canTransition(InteractionStatus.RESOLVED, InteractionStatus.RESOLVED)).toBe(false);
  });
});
