import React, { useEffect, useState } from 'react';
import { usePurchaseStore } from '../store/purchaseStore';
import { useAuthStore } from '../store/authStore';
import { useWarehouseStore } from '../store/warehouseStore';
import { useProductStore } from '../store/productStore';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extender el tipo jsPDF para incluir autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const ApprovalQueue = () => {
  const { user } = useAuthStore();
  const { requests, fetchRequests, approveRequest, rejectRequest, loading, assignWarehouse } = usePurchaseStore();
  const { warehouses, fetchWarehouses } = useWarehouseStore();
  const { products, fetchProducts } = useProductStore();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [comments, setComments] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedRequestForAssignment, setSelectedRequestForAssignment] = useState<any>(null);
  const [assignedWarehouseId, setAssignedWarehouseId] = useState<string>('');
  const [assignedProductId, setAssignedProductId] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [isNewProduct, setIsNewProduct] = useState<boolean>(false);

  useEffect(() => {
    fetchRequests();
    fetchWarehouses();
    fetchProducts();
  }, [fetchRequests, fetchWarehouses, fetchProducts]);

  const pendingRequests = requests.filter(request => {
    if (request.status !== 'pending_approval') return false;
    
    const currentApprovalLevel = request.approvalFlow.find(
      flow => flow.status === 'pending' && 
              flow.role === user?.permissions.role
    );
    
    return currentApprovalLevel !== undefined;
  }).filter(request => 
    request.requestDetails.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingAssignmentRequests = requests.filter(request => 
    request.status === 'pending_assignment' && user?.permissions.role === 'jefe_almacen'
  );

  const handleAssignWarehouse = async () => {
    if (!selectedRequestForAssignment) return;

    if (!assignedWarehouseId) {
      toast.error('Debe seleccionar un almacén.');
      return;
    }
    if (!isNewProduct && !assignedProductId) {
      toast.error('Debe seleccionar un producto o marcarlo como nuevo.');
      return;
    }
    if (!receiptNumber.trim()) {
      toast.error('Debe ingresar un número de recibo.');
      return;
    }

    try {
      await assignWarehouse(selectedRequestForAssignment._id, assignedWarehouseId, isNewProduct ? null : assignedProductId, receiptNumber);
      toast.success('Almacén y detalles asignados exitosamente');
      setShowAssignmentModal(false);
      setSelectedRequestForAssignment(null);
      setAssignedWarehouseId('');
      setAssignedProductId('');
      setReceiptNumber('');
      fetchRequests();
    } catch (error) {
      toast.error('Error al asignar el almacén y detalles.');
    }
  };

  const handleAction = async (requestId: string, level: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        const requestToApprove = requests.find(req => req._id === requestId);

        
        await approveRequest(requestId, level, comments);
        toast.success('Solicitud aprobada exitosamente');
      } else {
        if (!comments.trim()) {
          toast.error('Los comentarios son requeridos para rechazar');
          return;
        }
        await rejectRequest(requestId, level, comments);
        toast.success('Solicitud rechazada');
      }
      
      setSelectedRequest(null);
      setComments('');
      setActionType(null);
    } catch (error) {
      toast.error('Error al procesar la solicitud');
    }
  };

  const handleDownloadPDF = () => {
    if (pendingRequests.length === 0) {
      toast.error('No hay solicitudes pendientes para descargar.');
      return;
    }

    const doc = new jsPDF() as jsPDFWithAutoTable;

    doc.text('Solicitudes de Aprobación Pendientes', 14, 20);

    const tableColumn = ["N° Solicitud", "Descripción", "Solicitante", "Monto", "Fecha", "Críticidad"];
    const tableRows: any[][] = [];

    pendingRequests.forEach(request => {
      const requestData = [
        request.requestNumber,
        request.requestDetails.description,
        request.requestor.name,
        `$${request.requestDetails.estimatedCost.toLocaleString()} ${request.requestDetails.currency}`,
        format(new Date(request.createdAt), 'dd/MM/yyyy', { locale: es }),
        request.requestDetails.criticality.toUpperCase(),
      ];
      tableRows.push(requestData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [255, 179, 0] },
    });

    doc.save('solicitudes_pendientes.pdf');
    toast.success('PDF generado exitosamente.');
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

  const getCurrentApprovalLevel = (request: any) => {
    return request.approvalFlow.find(
      (flow: any) => flow.status === 'pending' && flow.role === user?.permissions.role
    )?.level || 0;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cola de Aprobaciones</h1>
          <p className="text-slate-600 mt-1">Solicitudes pendientes de su aprobación</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
            {pendingRequests.length} pendientes
          </div>
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={pendingRequests.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar solicitudes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Approval Queue */}
      <div className="space-y-4">
        {pendingRequests.length > 0 ? (
          pendingRequests.map((request) => {
            const currentLevel = getCurrentApprovalLevel(request);
            
            return (
              <div key={request._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-slate-800">
                          {request.requestNumber}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium border ${getCriticalityColor(request.requestDetails.criticality)}`}>
                          {request.requestDetails.criticality.toUpperCase()}
                        </span>
                        {request.requestDetails.criticality === 'critical' && (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      
                      <p className="text-slate-800 font-medium mb-2">
                        {request.requestDetails.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">Solicitante:</span> {request.requestor.name}
                        </div>
                        <div>
                          <span className="font-medium">Departamento:</span> {request.requestor.department}
                        </div>
                        <div>
                          <span className="font-medium">Fecha:</span> {format(new Date(request.createdAt), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div>
                          <span className="font-medium">Monto:</span> ${request.requestDetails.estimatedCost.toLocaleString()} {request.requestDetails.currency}
                        </div>
                        <div>
                          <span className="font-medium">Cantidad:</span> {request.requestDetails.specifications.quantity} {request.requestDetails.specifications.unitOfMeasure}
                        </div>
                        <div>
                          <span className="font-medium">Fecha Requerida:</span> {format(new Date(request.requestDetails.requiredDate), 'dd/MM/yyyy', { locale: es })}
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-medium text-slate-800 mb-2">Justificación:</h4>
                        <p className="text-slate-600 text-sm">{request.requestDetails.justification}</p>
                      </div>

                      {request.requestDetails.specifications.technicalSpecs && (
                        <div className="mt-3 p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-slate-800 mb-2">Especificaciones Técnicas:</h4>
                          <p className="text-slate-600 text-sm">{request.requestDetails.specifications.technicalSpecs}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setSelectedRequest(request._id);
                        setActionType('reject');
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rechazar
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(request._id);
                        setActionType('approve');
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aprobar
                    </button>
                  </div>
                </div>

                {/* Comments Modal */}
                {selectedRequest === request._id && (
                  <div className="border-t border-slate-200 p-6 bg-slate-50">
                    <div className="max-w-md mx-auto">
                      <h4 className="font-medium text-slate-800 mb-3">
                        {actionType === 'approve' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}
                      </h4>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Comentarios {actionType === 'reject' ? '(Requeridos)' : '(Opcionales)'}
                        </label>
                        <textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder={
                            actionType === 'approve' 
                              ? 'Comentarios adicionales (opcional)...'
                              : 'Explicar motivo del rechazo...'
                          }
                        />
                      </div>
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => {
                            setSelectedRequest(null);
                            setComments('');
                            setActionType(null);
                          }}
                          className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleAction(request._id, currentLevel, actionType!)}
                          disabled={loading || (actionType === 'reject' && !comments.trim())}
                          className={`px-4 py-2 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 ${
                            actionType === 'approve' 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-red-500 hover:bg-red-600'
                          }`}
                        >
                          {actionType === 'approve' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              No hay solicitudes pendientes
            </h3>
            <p className="text-slate-600">
              {searchTerm 
                ? 'No se encontraron solicitudes que coincidan con su búsqueda.'
                : 'Todas las solicitudes han sido procesadas o no hay solicitudes que requieran su aprobación.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pending Assignment Queue */}
      {user?.permissions.role === 'jefe_almacen' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 mt-8">Pendiente de Asignación de Almacén</h2>
          {pendingAssignmentRequests.length > 0 ? (
            pendingAssignmentRequests.map((request) => (
              <div key={request._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-slate-800">
                          {request.requestNumber}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium border ${getCriticalityColor(request.requestDetails.criticality)}`}>
                          {request.requestDetails.criticality.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium mb-2">
                        {request.requestDetails.description}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
                        <div>
                          <span className="font-medium">Solicitante:</span> {request.requestor.name}
                        </div>
                        <div>
                          <span className="font-medium">Departamento:</span> {request.requestor.department}
                        </div>
                        <div>
                          <span className="font-medium">Fecha:</span> {format(new Date(request.createdAt), 'dd/MM/yyyy', { locale: es })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setSelectedRequestForAssignment(request);
                        setShowAssignmentModal(true);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
                    >
                      Asignar Almacén
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                No hay solicitudes pendientes de asignación
              </h3>
            </div>
          )}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && selectedRequestForAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Asignar Almacén y Detalles a Solicitud: {selectedRequestForAssignment.requestNumber}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Seleccionar Almacén
                </label>
                <select
                  value={assignedWarehouseId}
                  onChange={(e) => setAssignedWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  {warehouses.map((warehouse: any) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Número de Recibo
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese el número de recibo"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isNewProduct"
                  checked={isNewProduct}
                  onChange={(e) => setIsNewProduct(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isNewProduct" className="ml-2 block text-sm text-gray-900">
                  Crear como nuevo producto
                </label>
              </div>
              <div style={{ display: isNewProduct ? 'none' : 'block' }}>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Seleccionar Producto Existente
                </label>
                <select
                  value={assignedProductId}
                  onChange={(e) => setAssignedProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isNewProduct}
                >
                  <option value="">Seleccionar...</option>
                  {products.map((product: any) => (
                    <option key={product._id} value={product._id}>
                      {product.name} ({product.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setSelectedRequestForAssignment(null);
                  setAssignedWarehouseId('');
                  setAssignedProductId('');
                  setReceiptNumber('');
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignWarehouse}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
              >
                Confirmar Asignación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalQueue;