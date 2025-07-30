import { create } from 'zustand';

export interface PurchaseRequest {
  _id: string;
  requestNumber: string;
  createdAt: string;
  updatedAt: string;
  status: 'pending_approval' | 'pending_assignment' | 'approved' | 'rejected' | 'cancelled' | 'in_transit' | 'received_partial' | 'received_complete' | 'completed';
  
  requestor: {
    userId: string;
    name: string;
    role: string;
    department: string;
    location: string;
  };
  
  requestDetails: {
    itemType: 'critical_spare' | 'consumable' | 'dangerous_material' | 'new_equipment' | 'specialized_service';
    description: string;
    specifications: {
      partNumber?: string;
      brand?: string;
      model?: string;
      quantity: number;
      unitOfMeasure: string;
      technicalSpecs?: string;
    };
    criticality: 'critical' | 'high' | 'medium' | 'low';
    justification: string;
    estimatedCost: number;
    currency: string;
    requiredDate: string;
    attachments: Array<{
      fileName: string;
      fileType: string;
      fileSize: number;
      uploadedAt: string;
    }>;
  };
  
  approvalFlow: Array<{
    level: number;
    role: string;
    userId?: string;
    userName?: string;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
    actionDate?: string;
    timeToAction?: number;
  }>;

  // NUEVA SECCIÓN: Información de Almacén
  warehouseInfo?: {
    assignedWarehouse?: {
      _id: string;
      name: string;
      location: {
        address: string;
      };
    };
    productId?: {
      _id: string;
      name: string;
      code: string;
    };
    warehouseReceipt?: string;
    receivedQuantity: number;
    pendingQuantity: number;
    warehouseStatus: 'pending_assignment' | 'assigned' | 'in_transit' | 'received_partial' | 'received_complete' | 'completed';
    assignedDate?: string;
    expectedDeliveryDate?: string;
    actualDeliveryDate?: string;
  };
  
  metrics: {
    totalApprovalTime?: number;
    escalations: number;
    slaCompliance: boolean;
  };

  // Virtual fields
  completionPercentage?: number;
}

interface PurchaseStore {
  requests: PurchaseRequest[];
  loading: boolean;
  error: string | null;
  fetchRequests: () => Promise<void>;
  createRequest: (request: Partial<PurchaseRequest>) => Promise<void>;
  createBulkRequests: (requests: Partial<PurchaseRequest>[]) => Promise<any>;
  updateRequest: (id: string, updates: Partial<PurchaseRequest>) => Promise<void>;
  approveRequest: (id: string, level: number, comments?: string) => Promise<void>;
  rejectRequest: (id: string, level: number, comments: string) => Promise<void>;
  getPendingApprovals: () => Promise<void>;
  getApprovedForWarehouse: () => Promise<PurchaseRequest[]>;
  assignWarehouse: (requestId: string, warehouseId: string, productId: string, receiptNumber: string, expectedDeliveryDate?: string) => Promise<void>;
  receiveWarehouseReceipt: (receiptId: string, items: { itemId: string; receivedQuantity: number }[]) => Promise<void>;
}

const API_BASE_URL = '/api';

export const UNIT_OF_MEASURE_ENUM = ['units', 'meters', 'liters', 'kilograms', 'hours', 'services'];

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

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
  requests: [],
  loading: false,
  error: null,
  
  fetchRequests: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/purchases`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        set({ requests: data.requests, loading: false });
      } else {
        const errorData = await response.json();
        set({ error: errorData.message || 'Failed to fetch requests', loading: false });
      }
    } catch (error) {
      set({ error: 'Network error fetching requests', loading: false });
      console.error('Fetch requests error:', error);
    }
  },
  
  createRequest: async (requestData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/purchases`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const data = await response.json();
        set(state => ({
          requests: [data.request, ...state.requests],
          loading: false
        }));
      } else {
        const errorData = await response.json();
        set({ error: errorData.message || 'Failed to create request', loading: false });
        throw new Error(errorData.message);
      }
    } catch (error) {
      set({ error: 'Network error creating request', loading: false });
      throw error;
    }
  },

  createBulkRequests: async (requests) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/purchases/bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ requests }),
      });

      const data = await response.json();

      if (response.ok) {
        set({ loading: false });
        return data; 
      } else {
        set({ error: data.message || 'Failed to create bulk requests', loading: false });
        throw new Error(data.message);
      }
    } catch (error) {
      set({ error: 'Network error creating bulk requests', loading: false });
      throw error;
    }
  },
  
  updateRequest: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/purchases/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        set(state => ({
          requests: state.requests.map(req => 
            req._id === id ? data.request : req
          ),
          loading: false
        }));
      } else {
        const errorData = await response.json();
        set({ error: errorData.message || 'Failed to update request', loading: false });
        throw new Error(errorData.message);
      }
    } catch (error) {
      set({ error: 'Network error updating request', loading: false });
      throw error;
    }
  },
  
  approveRequest: async (id, level, comments) => {
    try {
      const response = await fetch(`${API_BASE_URL}/purchases/${id}/action`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: 'approve',
          level,
          comments
        }),
      });

      if (response.ok) {
        const data = await response.json();
        set(state => ({
          requests: state.requests.map(req => 
            req._id === id ? data.request : req
          )
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error) {
      console.error('Approve request error:', error);
      throw error;
    }
  },
  
  rejectRequest: async (id, level, comments) => {
    try {
      const response = await fetch(`${API_BASE_URL}/purchases/${id}/action`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: 'reject',
          level,
          comments
        }),
      });

      if (response.ok) {
        const data = await response.json();
        set(state => ({
          requests: state.requests.map(req => 
            req._id === id ? data.request : req
          )
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error) {
      console.error('Reject request error:', error);
      throw error;
    }
  },

  getPendingApprovals: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/purchases/pending/approvals`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        set({ requests: data.requests, loading: false });
      } else {
        const errorData = await response.json();
        set({ error: errorData.message || 'Failed to fetch pending approvals', loading: false });
      }
    } catch (error) {
      set({ error: 'Network error fetching pending approvals', loading: false });
      console.error('Get pending approvals error:', error);
    }
  },

  getApprovedForWarehouse: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/purchases/approved-for-warehouse`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return data.requests;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error) {
      console.error('Get approved for warehouse error:', error);
      throw error;
    }
  },

  assignWarehouse: async (requestId, warehouseId, productId, receiptNumber, expectedDeliveryDate) => {
    try {
      const response = await fetch(`${API_BASE_URL}/purchases/${requestId}/assign-warehouse`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          warehouseId,
          productId,
          receiptNumber,
          expectedDeliveryDate
        }),
      });

      if (response.ok) {
        const data = await response.json();
        set(state => ({
          requests: state.requests.map(req => 
            req._id === requestId ? data.request : req
          )
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error) {
      console.error('Assign warehouse error:', error);
      throw error;
    }
  },

  receiveWarehouseReceipt: async (receiptId, items) => {
    try {
      const response = await fetch(`${API_BASE_URL}/warehouse-ops/receipts/${receiptId}/receive`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items }),
      });

      if (response.ok) {
        const data = await response.json();
        // Optionally, update the state to reflect the changes
        // This might require fetching the updated purchase request or handling it in a more sophisticated way
        console.log('Receipt processed successfully', data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
    } catch (error) {
      console.error('Receive warehouse receipt error:', error);
      throw error;
    }
  }
}));