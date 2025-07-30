import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { usePurchaseStore } from './store/purchaseStore';
import { useWarehouseStore } from './store/warehouseStore';
import { useSocket } from './hooks/useSocket';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PurchaseRequests from './components/PurchaseRequests';
import CreateRequest from './components/CreateRequest';
import ApprovalQueue from './components/ApprovalQueue';
import Analytics from './components/Analytics';
import UserManagement from './components/UserManagement';
import Warehouse from './components/Warehouse';
import Layout from './components/Layout';

function App() {
  const { isAuthenticated } = useAuthStore();
  const socket = useSocket();
  const purchaseStore = usePurchaseStore();
  const warehouseStore = useWarehouseStore();

  useEffect(() => {
    if (socket) {
      socket.on('request:approved', ({ request, receipt }) => {
        purchaseStore.requests.push(request);
        warehouseStore.receipts.push(receipt);
      });

      socket.on('receipt:confirmed', ({ receipt, purchaseRequest }) => {
        const updatedRequests = purchaseStore.requests.map(r => r._id === purchaseRequest._id ? purchaseRequest : r);
        purchaseStore.requests = updatedRequests;

        const updatedReceipts = warehouseStore.receipts.map(r => r._id === receipt._id ? receipt : r);
        warehouseStore.receipts = updatedReceipts;
      });

      return () => {
        socket.off('request:approved');
        socket.off('receipt:confirmed');
      };
    }
  }, [socket, purchaseStore, warehouseStore]);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
            },
          }}
        />
        
        <Routes>
          <Route
            path="/login"
            element={
              !isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />
            }
          />
          
          {isAuthenticated ? (
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="requests" element={<PurchaseRequests />} />
              <Route path="requests/new" element={<CreateRequest />} />
              <Route path="approvals" element={<ApprovalQueue />} />
              <Route path="warehouse" element={<Warehouse />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="users" element={<UserManagement />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;