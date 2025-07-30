import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { usePurchaseStore, UNIT_OF_MEASURE_ENUM } from '../store/purchaseStore';
import { useAuthStore } from '../store/authStore';
import {
  Save,
  ArrowLeft,
  Upload,
  AlertTriangle,
  DollarSign,
  Calendar,
  FileText,
  X,
  FileUp,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import Papa from 'papaparse';

interface RequestForm {
  itemType: 'critical_spare' | 'consumable' | 'dangerous_material' | 'new_equipment' | 'specialized_service';
  description: string;
  partNumber?: string;
  brand?: string;
  model?: string;
  quantity: number;
  unitOfMeasure: string;
  technicalSpecs?: string;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  justification: string;
  estimatedCost: number;
  currency: string;
  requiredDate: string;
}

const CreateRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createRequest, createBulkRequests, loading } = usePurchaseStore();
  const [attachments, setAttachments] = useState<File[]>([]);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<RequestForm>({
    defaultValues: {
      currency: 'USD',
      unitOfMeasure: 'units',
      criticality: 'medium',
      quantity: 1
    }
  });

  const itemType = watch('itemType');
  const criticality = watch('criticality');
  const estimatedCost = watch('estimatedCost');

  const onSubmit = async (data: RequestForm) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    try {
      const requestData = {
        requestDetails: {
          itemType: data.itemType,
          description: data.description,
          specifications: {
            partNumber: data.partNumber || '',
            brand: data.brand || '',
            model: data.model || '',
            quantity: Number(data.quantity),
            unitOfMeasure: data.unitOfMeasure,
            technicalSpecs: data.technicalSpecs || ''
          },
          criticality: data.criticality,
          justification: data.justification,
          estimatedCost: Number(data.estimatedCost),
          currency: data.currency,
          requiredDate: data.requiredDate,
          attachments: attachments.map(file => ({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            uploadedAt: new Date().toISOString()
          }))
        },
        approvalFlow: getApprovalPreview(Number(data.estimatedCost), data.criticality, data.itemType).map((role, index) => ({
          level: index + 1,
          role: role.toLowerCase().replace(/ /g, '_'),
          status: 'pending'
        }))
      };

      await createRequest(requestData);
      toast.success('Solicitud creada exitosamente');
      reset();
      navigate('/requests');
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast.error(error.message || 'Error al crear la solicitud');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Archivo ${file.name} es muy grande (máximo 10MB)`);
        return false;
      }
      return true;
    });
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedRequests = results.data as any[];

        const requestsToCreate = parsedRequests
          .filter(req => req.description && req.itemType && req.criticality && req.estimatedCost && req.quantity)
          .map(req => ({
            requestDetails: {
              itemType: req.itemType,
              description: req.description,
              specifications: {
                partNumber: req.partNumber || '',
                brand: req.brand || '',
                model: req.model || '',
                quantity: Number(req.quantity),
                unitOfMeasure: req.unitOfMeasure,
                technicalSpecs: req.technicalSpecs || ''
              },
              criticality: req.criticality,
              justification: req.justification,
              estimatedCost: Number(req.estimatedCost),
              currency: req.currency,
              requiredDate: req.requiredDate,
              attachments: []
            },
            approvalFlow: getApprovalPreview(Number(req.estimatedCost), req.criticality, req.itemType).map((role, index) => ({
              level: index + 1,
              role: role.toLowerCase().replace(/ /g, '_'),
              status: 'pending'
            }))
          }));

        if (requestsToCreate.length === 0) {
          toast.error("No se encontraron solicitudes válidas en el archivo CSV.");
          return;
        }

        try {
          const response = await createBulkRequests(requestsToCreate);
          toast.success(response.message);
          if (response.results?.failed.length > 0) {
            console.error('Failed requests:', response.results.failed);
            toast.error(`${response.results.failed.length} requests failed to import.`);
          }
          navigate('/requests');
        } catch (error: any) {
          toast.error(error.message || 'Error during bulk import.');
        }
      },
      error: (error: any) => {
        toast.error(`Error parsing CSV file: ${error.message}`);
      }
    });
  };
  
  const handleDownloadTemplate = () => {
    const headers = [
      "itemType", "description", "partNumber", "brand", "model", 
      "quantity", "unitOfMeasure", "technicalSpecs", "criticality", 
      "justification", "estimatedCost", "currency", "requiredDate"
    ];
    const examples = [
      {
        itemType: 'consumable',
        description: 'Filtro de aceite para motor',
        partNumber: '12345-ABC',
        brand: 'Fleetguard',
        model: 'LF9009',
        quantity: 10,
        unitOfMeasure: 'units',
        technicalSpecs: 'Eficiencia de 98.7% a 15 micrones',
        criticality: 'medium',
        justification: 'Mantenimiento preventivo programado para la flota de camiones',
        estimatedCost: 50.00,
        currency: 'USD',
        requiredDate: '2025-08-01'
      },
      {
        itemType: 'critical_spare',
        description: 'Bomba hidráulica principal',
        partNumber: 'XYZ-9876',
        brand: 'Bosch Rexroth',
        model: 'A11VO',
        quantity: 1,
        unitOfMeasure: 'units',
        technicalSpecs: 'Presión máxima de 350 bar',
        criticality: 'critical',
        justification: 'Repuesto crítico para excavadora principal, riesgo de parada de producción',
        estimatedCost: 15000.00,
        currency: 'USD',
        requiredDate: '2025-07-15'
      }
    ];

    const csv = Papa.unparse(examples, {
        columns: headers,
        header: true
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_solicitudes.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getApprovalPreview = (cost: number, crit: string, item: string) => {
    if (!cost || !crit) return [];
    const flow = ['Supervisor Mantenimiento'];
    if (cost > 5000 || ['high', 'critical'].includes(crit)) {
      flow.push('Jefe Mantenimiento');
    }
    if (cost > 25000 || crit === 'critical') {
      flow.push('Superintendent Operaciones');
    }
    if (['new_equipment', 'specialized_service'].includes(item) && cost > 10000) {
      flow.push('Gerente Abastecimientos');
    }
    if (cost > 100000) {
      flow.push('Gerente Financiero');
    }
    if (cost > 500000) {
      flow.push('Gerente General');
    }
    return flow;
  };

  const getCriticalityInfo = (level: string) => {
    const info = {
      critical: { color: 'text-red-600 bg-red-50 border-red-200', text: 'Crítica - Parada inmediata de operaciones' },
      high: { color: 'text-orange-600 bg-orange-50 border-orange-200', text: 'Alta - Parada en 24-48 horas' },
      medium: { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', text: 'Media - Parada programada en semana' },
      low: { color: 'text-green-600 bg-green-50 border-green-200', text: 'Baja - Mantenimiento programado' }
    };
    return info[level as keyof typeof info] || info.medium;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/requests')}
            className="mr-4 p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Nueva Solicitud de Compra</h1>
            <p className="text-slate-600">Complete la información requerida para su solicitud</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept=".csv"
            ref={csvInputRef}
            onChange={handleCsvUpload}
            className="hidden"
          />
          <button
            onClick={() => csvInputRef.current?.click()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
          >
            <FileUp className="w-4 h-4 mr-2" />
            Importar CSV
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Plantilla
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              {criticality && (
                <div className={`mt-2 p-2 rounded-lg border text-sm ${getCriticalityInfo(criticality).color}`}>
                  {getCriticalityInfo(criticality).text}
                </div>
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
                  min: { value: 1, message: 'La cantidad debe ser mayor a 0' },
                  valueAsNumber: true
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
                {UNIT_OF_MEASURE_ENUM.map(unit => (
                  <option key={unit} value={unit}>
                    {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  </option>
                ))}
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
                  min: { value: 0.01, message: 'El costo debe ser mayor a 0' },
                  valueAsNumber: true
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
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.requiredDate && (
              <p className="text-red-600 text-sm mt-1">{errors.requiredDate.message}</p>
            )}
          </div>
        </div>

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

        {estimatedCost && criticality && (
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Flujo de Aprobación Estimado
            </h2>
            <div className="flex flex-wrap gap-2">
              {getApprovalPreview(estimatedCost, criticality, itemType).map((approver, index) => (
                <div key={index} className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {index + 1}. {approver}
                  </span>
                  {index < getApprovalPreview(estimatedCost, criticality, itemType).length - 1 && (
                    <span className="mx-2 text-blue-600">→</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-blue-700 text-sm mt-2">
              * El flujo final puede variar según las reglas de negocio configuradas
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Adjuntos (Opcional)
          </h2>
          
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600 mb-2">Arrastra archivos aquí o haz clic para seleccionar</p>
            <p className="text-slate-500 text-sm">Fotos, planos, especificaciones técnicas (Max 10MB cada archivo)</p>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer inline-block"
            >
              Seleccionar Archivos
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-slate-400 mr-2" />
                    <span className="text-sm text-slate-700">{file.name}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="px-6 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Guardando...' : 'Crear Solicitud'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRequest;
