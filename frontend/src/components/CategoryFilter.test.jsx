import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryFilter from './CategoryFilter';

describe('CategoryFilter', () => {
  it('renders category options and selected state', () => {
    render(
      <CategoryFilter
        categories={['Adventure', 'Classic', 'Fantasy']}
        selectedCategories={['Fantasy']}
        onToggleCategory={vi.fn()}
        onClearCategories={vi.fn()}
      />
    );

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filter by fantasy/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /filter by adventure/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onToggleCategory when a checkbox changes', async () => {
    const onToggleCategory = vi.fn();
    const user = userEvent.setup();

    render(
      <CategoryFilter
        categories={['Fantasy']}
        selectedCategories={[]}
        onToggleCategory={onToggleCategory}
        onClearCategories={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /filter by fantasy/i }));
    expect(onToggleCategory).toHaveBeenCalledWith('Fantasy');
  });

  it('shows clear button only when categories are selected', () => {
    const { rerender } = render(
      <CategoryFilter
        categories={['Fantasy']}
        selectedCategories={[]}
        onToggleCategory={vi.fn()}
        onClearCategories={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /clear selected categories/i })).not.toBeInTheDocument();

    rerender(
      <CategoryFilter
        categories={['Fantasy']}
        selectedCategories={['Fantasy']}
        onToggleCategory={vi.fn()}
        onClearCategories={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /clear selected categories/i })).toBeInTheDocument();
  });
});