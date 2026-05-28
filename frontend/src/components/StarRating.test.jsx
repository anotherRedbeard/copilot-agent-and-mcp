// generated-by-copilot: unit tests for the StarRating component
import React from 'react';
import { render, screen } from '@testing-library/react';
import StarRating from './StarRating';

describe('StarRating', () => {
  it('renders 5 star buttons', () => {
    render(<StarRating rating={0} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('fills the correct number of stars for rating=3', () => {
    const { container } = render(<StarRating rating={3} />);
    const filled = container.querySelectorAll('button[class*="filled"]');
    const empty = container.querySelectorAll('button[class*="empty"]');
    expect(filled).toHaveLength(3);
    expect(empty).toHaveLength(2);
  });

  it('fills all 5 stars for rating=5', () => {
    const { container } = render(<StarRating rating={5} />);
    const filled = container.querySelectorAll('button[class*="filled"]');
    expect(filled).toHaveLength(5);
  });

  it('fills no stars for rating=0', () => {
    const { container } = render(<StarRating rating={0} />);
    const filled = container.querySelectorAll('button[class*="filled"]');
    expect(filled).toHaveLength(0);
  });
});
