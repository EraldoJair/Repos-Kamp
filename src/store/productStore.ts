import { create } from 'zustand';

export interface Product {
  _id: string;
  name: string;
  code: string;
  description: string;
  unitOfMeasure: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  location: string;
  supplierInfo: {
    name: string;
    contact: string;
  };
  audit: {
    createdBy: string;
    createdAt: string;
    modifiedBy: string;
    updatedAt: string;
  };
}

interface ProductStore {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
}

const API_BASE_URL = '/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const authData = localStorage.getItem('auth-storage');
  if (authData) {
    const { state } = JSON.parse(authData);
    if (state.token) {
      return {
        'Authorization': `Bearer ${state.token}`,
        'Content-Type': 'application/json',
      };
    }
  }
  return {
    'Content-Type': 'application/json',
  };
};

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        set({ products: data.products, loading: false });
      } else {
        const errorData = await response.json();
        set({ error: errorData.message || 'Failed to fetch products', loading: false });
      }
    } catch (error) {
      set({ error: 'Network error fetching products', loading: false });
      console.error('Fetch products error:', error);
    }
  },
}));
