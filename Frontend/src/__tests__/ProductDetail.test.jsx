import React from 'react';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../AuthContext.jsx';
import ProductDetail from '../pages/ProductDetail.jsx';

vi.mock('../api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

import api from '../api.js';

describe('ProductDetail page', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'token');
    localStorage.setItem('user', JSON.stringify({ _id: 'user1', role: 'user' }));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('loads product and adds to cart', async () => {
    const product = { _id: 'p1', name: 'Phone', variants: [{ price: 1000, size: '64GB', color: 'Black' }], description: 'desc' };
    api.get.mockImplementation((url) => {
      if (url.startsWith('/products/')) return Promise.resolve({ data: product });
      if (url.startsWith('/reviews')) return Promise.resolve({ data: { reviews: [], averageRating: 0, reviewCount: 0 } });
      return Promise.resolve({ data: {} });
    });

    api.post.mockResolvedValue({ data: {} });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/product/p1"]}>
          <Routes>
            <Route path="/product/:id" element={<ProductDetail />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getAllByText('Phone').length).toBeGreaterThan(0));
    const btn = screen.getAllByText(/Thêm vào giỏ hàng/i)[0];
    fireEvent.click(btn);

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/cart', expect.any(Object)));
    await waitFor(() => expect(screen.getAllByText(/Added to cart|giỏ hàng/).length).toBeGreaterThan(0));
  });
});
