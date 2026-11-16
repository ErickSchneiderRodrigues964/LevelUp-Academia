import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExerciseAnimation } from './ExerciseAnimation';

const images = ['/exercicios/prancha/0.jpg', '/exercicios/prancha/1.jpg'];

function mockReducedMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduced }) as unknown as typeof matchMedia;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('ExerciseAnimation', () => {
  it('descreve a demonstração só na primeira foto', () => {
    mockReducedMotion(false);
    render(<ExerciseAnimation images={images} alt="Prancha" />);

    expect(screen.getByAltText('Demonstração: Prancha')).toBeInTheDocument();
    expect(document.querySelectorAll('img')).toHaveLength(2);
  });

  it('alterna entre as duas fotos em loop', () => {
    mockReducedMotion(false);
    render(<ExerciseAnimation images={images} alt="Prancha" />);
    const [first, second] = Array.from(document.querySelectorAll('img'));
    expect(first.style.opacity).toBe('1');
    expect(second.style.opacity).toBe('0');

    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(first.style.opacity).toBe('0');
    expect(second.style.opacity).toBe('1');

    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(first.style.opacity).toBe('1');
  });

  it('o botão pausa e retoma a animação', () => {
    mockReducedMotion(false);
    render(<ExerciseAnimation images={images} alt="Prancha" controls />);
    const [first] = Array.from(document.querySelectorAll('img'));

    fireEvent.click(screen.getByRole('button', { name: 'Pausar animação' }));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(first.style.opacity).toBe('1');
    expect(screen.getByText('Início')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reproduzir animação' }));
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(first.style.opacity).toBe('0');
    expect(screen.getByText('Fim')).toBeInTheDocument();
  });

  it('com "reduzir movimento" fica parada na primeira foto', () => {
    mockReducedMotion(true);
    render(<ExerciseAnimation images={images} alt="Prancha" />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(document.querySelectorAll('img')[0].style.opacity).toBe('1');
  });
});
