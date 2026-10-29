"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartItem, ProductRecord } from "@/types";
import {
  addOrUpdateCartItem,
  calculateCartTotals,
  CART_CHANGE_EVENT,
  CART_STORAGE_KEY,
  getServerCartSnapshot,
  getStoredCartItems,
  removeCartItem,
  setStoredCartItems,
  updateCartItemQuantity,
} from "@/lib/cart";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";

interface CustomerCartContextValue {
  items: CartItem[];
  subtotal: number;
  total: number;
  totalItems: number;
  uniqueItems: number;
  getItemQuantity: (productId: string) => number;
  addItem: (
    product: ProductRecord,
    quantity: number,
    selectedPackSize?: string
  ) =>
    | { ok: true; item: CartItem }
    | { ok: false; error: string; availableStock: number };
  setItemQuantity: (
    productId: string,
    quantity: number,
    authoritativeProduct?: ProductRecord | null
  ) => { ok: true } | { ok: false; error: string; availableStock: number };
  setItemPackSize: (productId: string, packSize: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  syncWithValidatedItems: (validatedItems: readonly CartItem[]) => void;
}

const CustomerCartContext = createContext<CustomerCartContextValue | null>(
  null
);

function subscribeToCartPreference(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === CART_STORAGE_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CART_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CART_CHANGE_EVENT, onStoreChange);
  };
}

export function CustomerCartProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguagePreference();
  const items = useSyncExternalStore<CartItem[]>(
    subscribeToCartPreference,
    getStoredCartItems,
    getServerCartSnapshot
  );

  const totals = useMemo(() => calculateCartTotals(items), [items]);

  const getItemQuantity = useCallback(
    (productId: string): number => {
      const found = items.find((item) => item.productId === productId);
      return found ? found.quantity : 0;
    },
    [items]
  );

  const addItem = useCallback(
    (
      product: ProductRecord,
      quantity: number,
      selectedPackSize?: string
    ) => {
      const current = getStoredCartItems();
      const result = addOrUpdateCartItem(
        current,
        product,
        quantity,
        selectedPackSize,
        language
      );
      if (!result.ok) {
        return {
          ok: false as const,
          error: result.error,
          availableStock: result.availableStock,
        };
      }
      setStoredCartItems(result.items);
      return {
        ok: true as const,
        item: result.item,
      };
    },
    [language]
  );

  const setItemQuantity = useCallback(
    (
      productId: string,
      quantity: number,
      authoritativeProduct?: ProductRecord | null
    ) => {
      const current = getStoredCartItems();
      const result = updateCartItemQuantity(
        current,
        productId,
        quantity,
        authoritativeProduct,
        language
      );
      if (!result.ok) {
        return {
          ok: false as const,
          error: result.error,
          availableStock: result.availableStock,
        };
      }
      setStoredCartItems(result.items);
      return { ok: true as const };
    },
    [language]
  );

  const setItemPackSize = useCallback(
    (productId: string, packSize: string) => {
      const trimmed = packSize.trim();
      if (!trimmed) return;
      const current = getStoredCartItems();
      const updated = current.map((item) =>
        item.productId === productId ? { ...item, packSize: trimmed } : item
      );
      setStoredCartItems(updated);
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    const current = getStoredCartItems();
    const updated = removeCartItem(current, productId);
    setStoredCartItems(updated);
  }, []);

  const clearCart = useCallback(() => {
    setStoredCartItems([]);
  }, []);

  const syncWithValidatedItems = useCallback(
    (validatedItems: readonly CartItem[]) => {
      setStoredCartItems(validatedItems);
    },
    []
  );

  const contextValue = useMemo<CustomerCartContextValue>(
    () => ({
      items,
      subtotal: totals.subtotal,
      total: totals.total,
      totalItems: totals.totalItems,
      uniqueItems: totals.uniqueItems,
      getItemQuantity,
      addItem,
      setItemQuantity,
      setItemPackSize,
      removeItem,
      clearCart,
      syncWithValidatedItems,
    }),
    [
      items,
      totals,
      getItemQuantity,
      addItem,
      setItemQuantity,
      setItemPackSize,
      removeItem,
      clearCart,
      syncWithValidatedItems,
    ]
  );

  return (
    <CustomerCartContext.Provider value={contextValue}>
      {children}
    </CustomerCartContext.Provider>
  );
}

export function useCustomerCart(): CustomerCartContextValue {
  const context = useContext(CustomerCartContext);
  if (!context) {
    throw new Error(
      "useCustomerCart must be used within a CustomerCartProvider"
    );
  }
  return context;
}
