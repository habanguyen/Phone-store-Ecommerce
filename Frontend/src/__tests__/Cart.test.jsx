import React from 'react';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../AuthContext.jsx';
import Cart from '../pages/Cart.jsx';

vi.mock('../api.js', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

import api from '../api.js';

describe('Cart page', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'token');
    localStorage.setItem('user', JSON.stringify({ _id: 'user1', role: 'user' }));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('loads and displays cart items and total', async () => {
    api.get.mockResolvedValue({ data: { items: [{ _id: '1', product: { name: 'Phone' }, size: '64GB', color: 'Black', quantity: 2, price: 1000 }], totalPrice: 2000 } });

    render(
      <AuthProvider>
        <MemoryRouter>
          <Cart />
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getAllByText('Phone').length).toBeGreaterThan(0));
    expect(screen.getAllByText(/Total:/i)[0]).toBeTruthy();
    expect(screen.getAllByText(/2,000/)[0]).toBeTruthy();
  });

  it('updates quantity on blur and updates UI', async () => {
    const initial = { items: [{ _id: '1', product: { name: 'Phone' }, size: '64GB', color: 'Black', quantity: 2, price: 1000 }], totalPrice: 2000 };
    const updated = { items: [{ _id: '1', product: { name: 'Phone' }, size: '64GB', color: 'Black', quantity: 3, price: 1000 }], totalPrice: 3000 };

    api.get.mockResolvedValue({ data: initial });
    api.put.mockResolvedValue({ data: updated });

    render(
      <AuthProvider>
        <MemoryRouter>
          <Cart />
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getAllByDisplayValue('2').length).toBeGreaterThan(0));

    const input = screen.getAllByDisplayValue('2')[0];
    fireEvent.change(input, { target: { value: '3' } });
    fireEvent.blur(input);

    await waitFor(() => expect(api.put).toHaveBeenCalled());
    await waitFor(() => expect(screen.getAllByText(/3,000/)[0]).toBeTruthy());
  });

  it('removes item when clicking Remove', async () => {
    const initial = { items: [{ _id: '1', product: { name: 'Phone' }, size: '64GB', color: 'Black', quantity: 1, price: 1000 }], totalPrice: 1000 };
    const empty = { items: [], totalPrice: 0 };

    api.get.mockResolvedValue({ data: initial });
    api.delete.mockResolvedValue({ data: empty });

    render(
      <AuthProvider>
        <MemoryRouter>
          <Cart />
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getAllByText('Phone').length).toBeGreaterThan(0));
    const btn = screen.getByText(/Remove/i);
    fireEvent.click(btn);

    await waitFor(() => expect(api.delete).toHaveBeenCalled());
    await waitFor(() => expect(screen.getAllByText(/No items in cart/i)[0]).toBeTruthy());
  });
});
