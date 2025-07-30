import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePurchaseStore } from '../store/purchaseStore';
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Archive, // Icono para almacén
  Truck, // Icono para en tránsito
  FileText,
  DollarSign,
  PackageCheck, // Icono para recibido
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const PurchaseRequests = () => {
  const navigate = useNavigate();
  const { requests, fetchRequests, loading, updateRequest } = usePurchaseStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [criticalityFilter, setCriticalityFilter] = useState('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<any>();

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.requestDetails.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesCriticality = criticalityFilter === 'all' || request.requestDetails.criticality === criticalityFilter;
    
    return matchesSearch && matchesStatus && matchesCriticality;
  });

  const getCriticalityIcon = (criticality: string) => {
    switch (criticality) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'low': return <Clock className="w-4 h-4 text-green-600" />;
      default: return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getWarehouseStatusColor = (status: string) => {
    switch (status) {
      case 'pending_assignment': return 'text-gray-500 bg-gray-100';
      case 'assigned': return 'text-blue-500 bg-blue-100';
      case 'in_transit': return 'text-purple-500 bg-purple-100';
      case 'received_partial': return 'text-orange-500 bg-orange-100';
      case 'received_complete': return 'text-green-500 bg-green-100';
      case 'completed': return 'text-green-500 bg-green-100';
      default: return 'text-slate-500 bg-slate-100';
    }
  };

  const getWarehouseStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_assignment': return <Archive className="w-4 h-4 text-gray-500" />;
      case 'assigned': return <Archive className="w-4 h-4 text-blue-500" />;
      case 'in_transit': return <Truck className="w-4 h-4 text-purple-500" />;
      case 'received_partial': return <PackageCheck className="w-4 h-4 text-orange-500" />;
      case 'received_complete': return <PackageCheck className="w-4 h-4 text-green-500" />;
      case 'completed': return <PackageCheck className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const onSubmitEditRequest = async (data: any) => {
    if (!selectedRequest) return;

    try {
      const updatedRequest = {
        requestDetails: {
          itemType: data.itemType,
          description: data.description,
          specifications: {
            partNumber: data.partNumber || '',
            brand: data.brand || '',
            model: data.model || '',
            quantity: data.quantity,
            unitOfMeasure: data.unitOfMeasure,
            technicalSpecs: data.technicalSpecs || ''
          },
          criticality: data.criticality,
          justification: data.justification,
          estimatedCost: data.estimatedCost,
          currency: data.currency,
          requiredDate: data.requiredDate,
        }
      };

      await updateRequest(selectedRequest._id, updatedRequest);
      toast.success('Solicitud actualizada exitosamente');
      setShowEditModal(false);
      setSelectedRequest(null);
      reset();
      fetchRequests();
    } catch (error: any) {
      console.error('Error updating request:', error);
      toast.error(error.message || 'Error al actualizar la solicitud');
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-800">Solicitudes de Compra</h1>
          <p className="text-slate-600 mt-1">Gestión de solicitudes de equipos y repuestos</p>
        </div>
        <Link
          to="/requests/new"
          className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Solicitud
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
          
          <div>
            <select
              value={criticalityFilter}
              onChange={(e) => setCriticalityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">Todas las prioridades</option>
              <option value="critical">Crítica</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
          
          <button 
            onClick={() => console.log('Filtros Avanzados clicked')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros Avanzados
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-slate-600">Solicitud</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600">Descripción</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600">Solicitante</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600">Prioridad</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600">Monto</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600">Estado</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600">Estado Almacén</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600">Fecha</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-slate-50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-800">
                        {request.requestNumber}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-xs">
                        <p className="font-medium text-slate-800 truncate">
                          {request.requestDetails.description}
                        </p>
                        <p className="text-slate-500 text-sm truncate">
                          {request.requestDetails.specifications.partNumber && 
                           `P/N: ${request.requestDetails.specifications.partNumber}`}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-slate-800">{request.requestor?.name || 'N/A'}</p>
                        <p className="text-slate-500 text-sm">{request.requestor?.department || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        {getCriticalityIcon(request.requestDetails.criticality)}
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${getCriticalityColor(request.requestDetails.criticality)}`}>
                          {request.requestDetails.criticality.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-800">
                        ${request.requestDetails.estimatedCost.toLocaleString()} {request.requestDetails.currency}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        {getStatusIcon(request.status)}
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(request.status)}`}>
                          {request.status.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {request.warehouseInfo && (
                        <div>
                          <div className="flex items-center">
                            {getWarehouseStatusIcon(request.warehouseInfo.warehouseStatus)}
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${getWarehouseStatusColor(request.warehouseInfo.warehouseStatus)}`}>
                              {request.warehouseInfo.warehouseStatus.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          {request.completionPercentage > 0 && (
                            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                              <div 
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{ width: `${request.completionPercentage}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-600 text-sm">
                        {format(new Date(request.createdAt), 'dd/MM/yyyy')}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowViewModal(true);
                          }}
                          className="text-slate-600 hover:text-slate-800 p-1"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowEditModal(true);
                            setValue('itemType', request.requestDetails.itemType);
                            setValue('description', request.requestDetails.description);
                            setValue('partNumber', request.requestDetails.specifications.partNumber);
                            setValue('brand', request.requestDetails.specifications.brand);
                            setValue('model', request.requestDetails.specifications.model);
                            setValue('quantity', request.requestDetails.specifications.quantity);
                            setValue('unitOfMeasure', request.requestDetails.specifications.unitOfMeasure);
                            setValue('technicalSpecs', request.requestDetails.specifications.technicalSpecs);
                            setValue('criticality', request.requestDetails.criticality);
                            setValue('justification', request.requestDetails.justification);
                            setValue('estimatedCost', request.requestDetails.estimatedCost);
                            setValue('currency', request.requestDetails.currency);
                            setValue('requiredDate', format(new Date(request.requestDetails.requiredDate), 'yyyy-MM-dd'));
                          }}
                          className="text-slate-600 hover:text-slate-800 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              No se encontraron solicitudes
            </h3>
            <p className="text-slate-600 mb-4">
              No hay solicitudes que coincidan con los filtros seleccionados.
            </p>
            <Link
              to="/requests/new"
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Solicitud
            </Link>
          </div>
        )}
      </div>

      {/* View Request Modal */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-3xl w-full relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedRequest(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Detalles de Solicitud: {selectedRequest.requestNumber}</h2>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Información Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                  <div><strong>Tipo de Ítem:</strong> {selectedRequest.requestDetails.itemType}</div>
                  <div><strong>Prioridad:</strong> <span className={`px-2 py-1 text-xs rounded-full font-medium ${getCriticalityColor(selectedRequest.requestDetails.criticality)}`}>{selectedRequest.requestDetails.criticality.toUpperCase()}</span></div>
                  <div className="md:col-span-2"><strong>Descripción:</strong> {selectedRequest.requestDetails.description}</div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Especificaciones Técnicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                  <div><strong>Número de Parte:</strong> {selectedRequest.requestDetails.specifications.partNumber || 'N/A'}</div>
                  <div><strong>Marca:</strong> {selectedRequest.requestDetails.specifications.brand || 'N/A'}</div>
                  <div><strong>Modelo:</strong> {selectedRequest.requestDetails.specifications.model || 'N/A'}</div>
                  <div><strong>Cantidad:</strong> {selectedRequest.requestDetails.specifications.quantity} {selectedRequest.requestDetails.specifications.unitOfMeasure}</div>
                  <div className="md:col-span-2"><strong>Especificaciones Adicionales:</strong> {selectedRequest.requestDetails.specifications.technicalSpecs || 'N/A'}</div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Información Financiera</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                  <div><strong>Costo Estimado:</strong> ${selectedRequest.requestDetails.estimatedCost.toLocaleString()} {selectedRequest.requestDetails.currency}</div>
                  <div><strong>Fecha Requerida:</strong> {format(new Date(selectedRequest.requestDetails.requiredDate), 'dd/MM/yyyy', { locale: es })}</div>
                </div>
              </div>

              {/* Justification */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Justificación</h3>
                <p className="text-slate-700">{selectedRequest.requestDetails.justification}</p>
              </div>

              {/* Approval Flow */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Flujo de Aprobación</h3>
                <div className="space-y-3">
                  {selectedRequest.approvalFlow.map((step: any, index: number) => (
                    <div key={index} className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${step.status === 'approved' ? 'bg-green-100 text-green-800' : step.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {step.status.toUpperCase()}
                      </span>
                      <span className="ml-3 text-slate-700">Nivel {step.level}: {step.role}</span>
                      {step.userName && <span className="ml-2 text-slate-500">({step.userName})</span>}
                      {step.comments && <span className="ml-2 text-slate-600">- "{step.comments}"</span>}
                      {step.actionDate && <span className="ml-2 text-slate-500 text-xs">({format(new Date(step.actionDate), 'dd/MM/yyyy HH:mm')})</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Info */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Información de Auditoría</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700 text-sm">
                  <div><strong>Creado por:</strong> {selectedRequest.requestor?.name || 'N/A'} ({format(new Date(selectedRequest.createdAt), 'dd/MM/yyyy HH:mm')})</div>
                  {selectedRequest.audit?.modifiedBy?.profile && <div><strong>Última Modificación:</strong> {selectedRequest.audit.modifiedBy.profile.firstName} {selectedRequest.audit.modifiedBy.profile.lastName} ({format(new Date(selectedRequest.updatedAt), 'dd/MM/yyyy HH:mm')})</div>}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedRequest(null);
                }}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Request Modal */}
      {showEditModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-3xl w-full relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedRequest(null);
                reset();
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Editar Solicitud: {selectedRequest.requestNumber}</h2>

            <form onSubmit={handleSubmit(onSubmitEditRequest)} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Información Básica
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tipo de Ítem *
                    </label>
                    <select
                      {...register('itemType', { required: 'Seleccione un tipo de ítem' })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="">Seleccionar tipo...</option>
                      <option value="critical_spare">Repuesto Crítico</option>
                      <option value="consumable">Consumible</option>
                      <option value="dangerous_material">Material Peligroso</option>
                      <option value="new_equipment">Equipo Nuevo</option>
                      <option value="specialized_service">Servicio Especializado</option>
                    </select>
                    {errors.itemType && (
                      <p className="text-red-600 text-sm mt-1">{errors.itemType.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Prioridad *
                    </label>
                    <select
                      {...register('criticality', { required: 'Seleccione una prioridad' })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="low">Baja - Mantenimiento programado</option>
                      <option value="medium">Media - Parada en semana</option>
                      <option value="high">Alta - Parada en 24-48h</option>
                      <option value="critical">Crítica - Parada inmediata</option>
                    </select>
                    {errors.criticality && (
                      <p className="text-red-600 text-sm mt-1">{errors.criticality.message}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    {...register('description', { 
                      required: 'La descripción es requerida',
                      minLength: { value: 10, message: 'La descripción debe tener al menos 10 caracteres' }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Describa detalladamente el ítem solicitado..."
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">
                  Especificaciones Técnicas
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Número de Parte
                    </label>
                    <input
                      type="text"
                      {...register('partNumber')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="P/N o código"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Marca
                    </label>
                    <input
                      type="text"
                      {...register('brand')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Caterpillar, Komatsu, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Modelo
                    </label>
                    <input
                      type="text"
                      {...register('model')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="390F, PC4000, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      {...register('quantity', { 
                        required: 'La cantidad es requerida',
                        min: { value: 1, message: 'La cantidad debe ser mayor a 0' }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="1"
                    />
                    {errors.quantity && (
                      <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Unidad de Medida *
                    </label>
                    <select
                      {...register('unitOfMeasure', { required: 'Seleccione una unidad' })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="units">Units</option>
                      <option value="meters">Meters</option>
                      <option value="liters">Liters</option>
                      <option value="kilograms">Kilograms</option>
                      <option value="hours">Hours</option>
                      <option value="services">Services</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Especificaciones Técnicas Adicionales
                  </label>
                  <textarea
                    {...register('technicalSpecs')}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Presión máxima, temperatura, voltaje, dimensiones, etc."
                  />
                </div>
              </div>

              {/* Financial Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Información Financiera
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Costo Estimado *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('estimatedCost', { 
                        required: 'El costo estimado es requerido',
                        min: { value: 0.01, message: 'El costo debe ser mayor a 0' }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="25000.00"
                    />
                    {errors.estimatedCost && (
                      <p className="text-red-600 text-sm mt-1">{errors.estimatedCost.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Moneda *
                    </label>
                    <select
                      {...register('currency')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="USD">USD - Dólar Americano</option>
                      <option value="PEN">PEN - Sol Peruano</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha Requerida *
                  </label>
                  <input
                    type="date"
                    {...register('requiredDate', { required: 'La fecha requerida es obligatoria' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  {errors.requiredDate && (
                    <p className="text-red-600 text-sm mt-1">{errors.requiredDate.message}</p>
                  )}
                </div>
              </div>

              {/* Justification */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Justificación
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Justificación Técnica *
                  </label>
                  <textarea
                    {...register('justification', { 
                      required: 'La justificación es requerida',
                      minLength: { value: 20, message: 'La justificación debe tener al menos 20 caracteres' }
                    })}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Explique la razón de la solicitud, impacto operacional, consecuencias de no aprobar, etc."
                  />
                  {errors.justification && (
                    <p className="text-red-600 text-sm mt-1">{errors.justification.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedRequest(null);
                    reset();
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequests;