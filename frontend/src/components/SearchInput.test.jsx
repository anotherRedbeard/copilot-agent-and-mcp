import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchInput from './SearchInput';

describe('SearchInput', () => {
  it('renders a search input with placeholder', () => {
    render(<SearchInput value="" onChange={vi.fn()} onClear={vi.fn()} />);

    expect(screen.getByRole('searchbox', { name: /search books by title or author/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search by title or author/i)).toBeInTheDocument();
  });

  it('updates in real time as the user types', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    const WrappedSearchInput = () => {
      const [value, setValue] = React.useState('');

      return (
        <SearchInput
          value={value}
          onChange={(nextValue) => {
            onChange(nextValue);
            setValue(nextValue);
          }}
          onClear={vi.fn()}
        />
      );
    };

    render(<WrappedSearchInput />);

    await user.type(screen.getByRole('searchbox'), 'tolkien');

    expect(onChange).toHaveBeenCalledTimes(7);
    expect(onChange).toHaveBeenLastCalledWith('tolkien');
    expect(screen.getByRole('searchbox')).toHaveValue('tolkien');
  });

  it('shows clear button only when there is a value', () => {
    const { rerender } = render(<SearchInput value="" onChange={vi.fn()} onClear={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();

    rerender(<SearchInput value="rowling" onChange={vi.fn()} onClear={vi.fn()} />);

    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();

    render(<SearchInput value="jose" onChange={vi.fn()} onClear={onClear} />);

    await user.click(screen.getByRole('button', { name: /clear search/i }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
