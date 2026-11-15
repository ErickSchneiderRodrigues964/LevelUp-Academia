import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ScheduleClass } from '../api/types';
import { ScheduleGrid } from './ScheduleGrid';

function makeClass(weekday: number, startTime: string, modality: string): ScheduleClass {
  return {
    id: `${weekday}-${startTime}-${modality}`,
    weekday,
    startTime,
    durationMinutes: 45,
    capacity: 16,
    modality: { id: modality, name: modality },
    instructor: { id: 'i1', name: 'Rafael Monteiro' },
  };
}

describe('ScheduleGrid', () => {
  it('agrupa as aulas por dia da semana, em ordem de horário', () => {
    render(
      <ScheduleGrid
        classes={[
          makeClass(1, '20:00', 'Cross training'),
          makeClass(3, '12:00', 'Spinning'),
          makeClass(1, '06:00', 'Muay thai'),
        ]}
      />,
    );

    const monday = screen.getByRole('region', { name: 'Segunda' });
    const items = within(monday).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('06:00');
    expect(items[0]).toHaveTextContent('Muay thai');
    expect(items[1]).toHaveTextContent('20:00');

    const wednesday = screen.getByRole('region', { name: 'Quarta' });
    expect(within(wednesday).getByRole('listitem')).toHaveTextContent('Spinning');
  });

  it('mostra "Sem aulas" nos dias vazios', () => {
    render(<ScheduleGrid classes={[makeClass(1, '06:00', 'Spinning')]} />);

    const tuesday = screen.getByRole('region', { name: 'Terça' });
    expect(within(tuesday).getByText('Sem aulas')).toBeInTheDocument();
    expect(within(tuesday).queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('mostra segunda a sábado, e domingo só quando tem aula', () => {
    const { rerender } = render(<ScheduleGrid classes={[makeClass(1, '06:00', 'Spinning')]} />);
    expect(screen.getAllByRole('region')).toHaveLength(6);
    expect(screen.queryByRole('region', { name: 'Domingo' })).not.toBeInTheDocument();

    rerender(<ScheduleGrid classes={[makeClass(0, '09:00', 'Mobilidade')]} />);
    expect(screen.getByRole('region', { name: 'Domingo' })).toBeInTheDocument();
  });

  it('mostra instrutor e duração de cada aula', () => {
    render(<ScheduleGrid classes={[makeClass(1, '06:00', 'Spinning')]} />);

    const item = screen.getByRole('listitem');
    expect(item).toHaveTextContent('Rafael Monteiro');
    expect(item).toHaveTextContent('45 min');
  });

  it('com a lista vazia, avisa que a grade ainda não foi publicada', () => {
    render(<ScheduleGrid classes={[]} />);

    expect(screen.getByText(/grade ainda não foi publicada/i)).toBeInTheDocument();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
