import { mapPerAgent } from './metrics.mapper';

describe('mapPerAgent (cálculo de métricas)', () => {
  it('calcula la tasa de resolución = resueltas / total', () => {
    const [m] = mapPerAgent([
      { agentId: 'a', agentName: 'Ana', total: 4, resolved: 3, avgResolutionSeconds: 120 },
    ]);
    expect(m.resolutionRate).toBeCloseTo(0.75);
    expect(m.total).toBe(4);
    expect(m.resolved).toBe(3);
  });

  it('redondea el tiempo promedio de resolución', () => {
    const [m] = mapPerAgent([
      { agentId: 'a', agentName: 'Ana', total: 2, resolved: 2, avgResolutionSeconds: 120.6 },
    ]);
    expect(m.avgResolutionSeconds).toBe(121);
  });

  it('deja el promedio en null cuando no hay resueltas', () => {
    const [m] = mapPerAgent([
      { agentId: 'a', agentName: 'Ana', total: 3, resolved: 0, avgResolutionSeconds: null },
    ]);
    expect(m.avgResolutionSeconds).toBeNull();
  });

  it('no divide por cero: tasa = 0 si total = 0', () => {
    const [m] = mapPerAgent([
      { agentId: 'a', agentName: 'Ana', total: 0, resolved: 0, avgResolutionSeconds: null },
    ]);
    expect(m.resolutionRate).toBe(0);
  });

  it('convierte strings del driver (bigint) a número', () => {
    const [m] = mapPerAgent([
      { agentId: 'a', agentName: 'Ana', total: '10', resolved: '5', avgResolutionSeconds: '90' },
    ]);
    expect(m.total).toBe(10);
    expect(m.resolved).toBe(5);
    expect(m.resolutionRate).toBeCloseTo(0.5);
    expect(m.avgResolutionSeconds).toBe(90);
  });
});
