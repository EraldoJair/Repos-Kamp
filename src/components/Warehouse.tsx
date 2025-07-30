import React, { useEffect, useState } from 'react';
import { useWarehouseStore } from '../store/warehouseStore';
import { useAuthStore } from '../store/authStore';
import { usePurchaseStore } from '../store/purchaseStore';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  BarChart3,
  TrendingUp,
  DollarSign,
  Archive
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

const Warehouse = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [receivedQuantities, setReceivedQuantities] = useState<{[key: string]: number}>({});
  const [observations, setObservations] = useState('');

  const [approvedRequests, setApprovedRequests] = useState<any[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);

  const { 
    warehouses, 
    receipts, 
    stocks, 
    movements, 
    stats,
    loading,
    fetchWarehouses,
    fetchReceipts,
    fetchStocks,
    fetchMovements,
    fetchStats,
    confirmReceipt,
    createWarehouse,
    fetchAllUsers
  } = useWarehouseStore();

  const { getApprovedForWarehouse, assignWarehouse } = usePurchaseStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchWarehouses();
    fetchStats();
    if (activeTab === 'receipts') {
      fetchReceipts();
      fetchApprovedRequests();
    } else if (activeTab === 'inventory') {
      fetchStocks(selectedWarehouse);
    } else if (activeTab === 'movements') {
      fetchMovements();
    }
    if (user?.email === 'admin@minera.com') {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      const userList = await fetchAllUsers();
      setUsers(userList);
    } catch (error) {
      toast.error('Error al cargar los usuarios');
    }
  };

  const handleCreateWarehouse = async () => {
    try {
      await createWarehouse(newWarehouse);
      toast.success('Almacén creado exitosamente');
      setShowCreateModal(false);
      setNewWarehouse({});
      fetchWarehouses();
    } catch (error) {
      toast.error('Error al crear el almacén');
    }
  };

  const fetchApprovedRequests = async () => {
    try {
      const requests = await getApprovedForWarehouse();
      setApprovedRequests(requests);
    } catch (error) {
      toast.error('Error al cargar las solicitudes para recepción');
    }
  };

  

  const [receiptNumber, setReceiptNumber] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

  const handleAssignWarehouse = async () => {
    if (!selectedRequest || !selectedWarehouse || !receiptNumber) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      await assignWarehouse(
        selectedRequest._id,
        selectedWarehouse,
        selectedRequest.requestDetails.specifications.partNumber, // Assuming partNumber is the product identifier
        selectedRequest.requestDetails.specifications.partNumber, // Assuming partNumber is the product identifier
        receiptNumber,
        expectedDeliveryDate
      );
      toast.success('Almacén asignado exitosamente');
      setShowReceiptModal(false);
      setSelectedRequest(null);
      setReceiptNumber('');
      setExpectedDeliveryDate('');
      fetchApprovedRequests();
      fetchStats();
    } catch (error) {
      toast.error('Error al asignar el almacén');
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'text-yellow-600 bg-yellow-100';
      case 'pending_assignment': return 'text-blue-600 bg-blue-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'in_transit': return 'text-purple-600 bg-purple-100';
      case 'received_partial': return 'text-orange-600 bg-orange-100';
      case 'received_complete': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-3 h-3 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}% vs mes anterior
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Recepciones Pendientes"
          value={stats.pendingReceipts || 0}
          icon={Clock}
          color="text-yellow-600"
          subtitle="Requieren confirmación"
          trend={5}
        />
        <StatCard
          title="Productos en Stock"
          value={stats.productsInStock || 0}
          icon={Package}
          color="text-blue-600"
          subtitle="Con inventario disponible"
          trend={12}
        />
        <StatCard
          title="Valor Total Inventario"
          value={`$${(stats.totalInventoryValue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="text-green-600"
          subtitle="USD en inventario"
          trend={8}
        />
        <StatCard
          title="Movimientos Hoy"
          value={stats.todayMovements || 0}
          icon={TrendingUp}
          color="text-purple-600"
          subtitle="Transacciones del día"
          trend={-3}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Recepciones Recientes</h2>
          </div>
          <div className="p-6">
            {receipts.slice(0, 5).map((receipt) => (
              <div key={receipt._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-3 last:mb-0">
                <div>
                  <p className="font-medium text-slate-800">{receipt.receiptNumber}</p>
                  <p className="text-slate-500 text-sm">{receipt.purchaseRequest?.requestNumber}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(receipt.status)}`}>
                  {receipt.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Stock Bajo</h2>
          </div>
          <div className="p-6">
            {stocks.filter(s => s.availableQuantity < 10).slice(0, 5).map((stock) => (
              <div key={stock._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-3 last:mb-0">
                <div>
                  <p className="font-medium text-slate-800">{stock.product?.name}</p>
                  <p className="text-slate-500 text-sm">{stock.product?.code}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-red-600">{stock.availableQuantity}</p>
                  <p className="text-slate-500 text-xs">{stock.product?.unitOfMeasure}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderReceipts = () => (
    <div className="space-y-6">
      {/* Warehouse Receipts */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Gestión de Recepciones de Almacén</h2>
          <p className="text-slate-600 mt-1">Confirmar la entrada de productos de solicitudes aprobadas.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Solicitud</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Producto</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Estado</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Fecha Creación</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {approvedRequests.map((request) => (
                <tr key={request._id} className="hover:bg-slate-50">
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-800">{request.requestNumber}</div>
                    <div className="text-slate-500 text-sm truncate max-w-xs">{request.requestDetails?.description}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-800">{request.requestDetails.specifications.partNumber || 'N/A'}</div>
                    <div className="text-slate-500 text-sm">{request.requestDetails.specifications.brand || 'N/A'}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(request.status)}`}>
                      {request.status.toUpperCase().replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-slate-600 text-sm">
                      {format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowReceiptModal(true);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1 px-3 rounded transition-colors"
                      >
                        Asignar Almacén
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowReceiptModal(true);
                        }}
                        className="text-slate-600 hover:text-slate-800 p-1"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los almacenes</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Producto</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Código</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Almacén</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Disponible</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Reservado</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">En Tránsito</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Valor Total</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Último Movimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {stocks
                .filter(stock => 
                  (selectedWarehouse === 'all' || stock.warehouse._id === selectedWarehouse) &&
                  (searchTerm === '' || 
                   stock.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   stock.product.code.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map((stock) => (
                <tr key={stock._id} className="hover:bg-slate-50">
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-800">{stock.product.name}</div>
                    <div className="text-slate-500 text-sm">{stock.product.description}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-800">{stock.product.code}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-slate-800">{stock.warehouse.name}</div>
                    <div className="text-slate-500 text-sm">{stock.warehouse.location.address}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className={`font-medium ${stock.availableQuantity < 10 ? 'text-red-600' : 'text-green-600'}`}>
                      {stock.availableQuantity} {stock.product.unitOfMeasure}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-slate-800">{stock.reservedQuantity} {stock.product.unitOfMeasure}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-slate-800">{stock.inTransitQuantity} {stock.product.unitOfMeasure}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-800">${stock.totalValue.toLocaleString()}</div>
                    <div className="text-slate-500 text-sm">${stock.averageCost.toFixed(2)} c/u</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-slate-600 text-sm">
                      {format(new Date(stock.lastMovementDate), 'dd/MM/yyyy')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderMovements = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los almacenes</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>
            ))}
          </select>
          <select className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="all">Todos los tipos</option>
            <option value="inbound">Entrada</option>
            <option value="outbound">Salida</option>
            <option value="adjustment">Ajuste</option>
          </select>
          <input
            type="date"
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="date"
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Fecha</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Tipo</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Producto</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Almacén</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Cantidad</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Costo</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Referencia</th>
                <th className="text-left py-3 px-6 font-medium text-slate-600">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {movements.map((movement) => (
                <tr key={movement._id} className="hover:bg-slate-50">
                  <td className="py-4 px-6">
                    <div className="text-slate-800">
                      {format(new Date(movement.createdAt), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      movement.type === 'inbound' ? 'bg-green-100 text-green-800' :
                      movement.type === 'outbound' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {movement.type === 'inbound' ? 'ENTRADA' : 
                       movement.type === 'outbound' ? 'SALIDA' : 'AJUSTE'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-slate-800">{movement.product?.name}</div>
                    <div className="text-slate-500 text-sm">{movement.product?.code}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-slate-800">{movement.warehouse?.name}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className={`font-medium ${movement.type === 'inbound' ? 'text-green-600' : 'text-red-600'}`}>
                      {movement.type === 'inbound' ? '+' : '-'}{movement.quantity}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-slate-800">${movement.totalCost.toLocaleString()}</div>
                    <div className="text-slate-500 text-sm">${movement.unitCost.toFixed(2)} c/u</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-slate-800">{movement.reference?.number}</div>
                    <div className="text-slate-500 text-sm">{movement.reference?.type}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-slate-800">
                      {movement.performedBy?.profile?.firstName} {movement.performedBy?.profile?.lastName}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'receipts', name: 'Recepciones', icon: Truck },
    { id: 'inventory', name: 'Inventario', icon: Package },
    { id: 'movements', name: 'Movimientos', icon: Archive }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Almacenes</h1>
          <p className="text-slate-600 mt-1">Control de inventario y recepciones</p>
        </div>
        {user?.email === 'admin@minera.com' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Almacén
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'receipts' && renderReceipts()}
          {activeTab === 'inventory' && renderInventory()}
          {activeTab === 'movements' && renderMovements()}
        </div>
      </div>

      {/* Create Warehouse Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Crear Nuevo Almacén</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Código"
                onChange={(e) => setNewWarehouse({ ...newWarehouse, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Nombre"
                onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <select
                onChange={(e) => setNewWarehouse({ ...newWarehouse, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">Seleccione un tipo</option>
                <option value="principal">Principal</option>
                <option value="satelite">Satelite</option>
                <option value="movil">Móvil</option>
                <option value="temporal">Temporal</option>
              </select>
              <input
                type="text"
                placeholder="Dirección"
                onChange={(e) => setNewWarehouse({ ...newWarehouse, location: { ...newWarehouse.location, address: e.target.value } })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <select
                onChange={(e) => {
                  const selectedUser = users.find(u => u._id === e.target.value);
                  setNewWarehouse({ 
                    ...newWarehouse, 
                    responsible: { 
                      userId: selectedUser._id, 
                      name: `${selectedUser.profile.firstName} ${selectedUser.profile.lastName}`
                    } 
                  });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">Seleccione un responsable</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>{user.profile.firstName} {user.profile.lastName}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateWarehouse}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
              >
                Crear Almacén
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showReceiptModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Asignar Almacén: {selectedRequest.requestNumber}
            </h2>
            
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-slate-800 mb-2">Información de la Solicitud</h3>
                <p className="text-slate-600">Producto: {selectedRequest.requestDetails.description}</p>
                <p className="text-slate-600">Cantidad: {selectedRequest.requestDetails.specifications.quantity} {selectedRequest.requestDetails.specifications.unitOfMeasure}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Almacén *
                </label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Seleccione un almacén</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Número de Recepción *
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: REC-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha de Entrega Esperada
                </label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedRequest(null);
                  setReceiptNumber('');
                  setExpectedDeliveryDate('');
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignWarehouse}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
              >
                Asignar Almacén
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouse;