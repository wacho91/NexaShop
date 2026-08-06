import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi } from '../api';
import { useAuth } from '../hooks/useAuth';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0, items_count: 0 });
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await cartApi.get();
      setCart(data);
    } catch (error) {
      if (error.response?.status !== 401) {
        setCart({ items: [], total: 0, items_count: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart, isAuthenticated]);

  const addItem = useCallback(async (productId, quantity = 1) => {
    const { data } = await cartApi.addItem({ product_id: productId, quantity });

    setCart((prev) => {
      const exists = prev.items.find((i) => i.id === data.id);
      let items;

      if (exists) {
        items = prev.items.map((i) => (i.id === data.id ? data : i));
      } else {
        items = [...prev.items, data];
      }

      const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

      return {
        items,
        total: Math.round(total * 100) / 100,
        items_count: items.reduce((s, i) => s + i.quantity, 0),
      };
    });

    return data;
  }, []);

  const updateItem = useCallback(async (itemId, quantity) => {
    const { data } = await cartApi.updateItem(itemId, { quantity });

    setCart((prev) => {
      const items = prev.items.map((i) => (i.id === itemId ? data : i));
      const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

      return {
        items,
        total: Math.round(total * 100) / 100,
        items_count: items.reduce((s, i) => s + i.quantity, 0),
      };
    });

    return data;
  }, []);

  const removeItem = useCallback(async (itemId) => {
    await cartApi.removeItem(itemId);

    setCart((prev) => {
      const items = prev.items.filter((i) => i.id !== itemId);
      const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

      return {
        items,
        total: Math.round(total * 100) / 100,
        items_count: items.reduce((s, i) => s + i.quantity, 0),
      };
    });
  }, []);

  const clearCart = useCallback(async () => {
    await cartApi.clear();
    setCart({ items: [], total: 0, items_count: 0 });
  }, []);

  const value = useMemo(
    () => ({
      ...cart,
      loading,
      refreshCart,
      addItem,
      updateItem,
      removeItem,
      clearCart,
    }),
    [cart, loading, refreshCart, addItem, updateItem, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
