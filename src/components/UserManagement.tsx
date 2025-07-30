import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  Settings,
  UserPlus,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface UserData {
  _id: string;
  employeeId: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    position: string;
    department: string;
    location: string;
    phone?: string;
  };
  permissions: {
    role: string;
    approvalLimits: {
      maxAmount: number;
      currency: string;
    };
  };
  status: string;
  lastLogin: string;
}

interface NewUserForm {
  employeeId: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  location: string;
  phone?: string;
  role: string;
  maxAmount: number;
  currency: string;
}

interface EditUserForm {
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  location: string;
  phone?: string;
  role: string;
  maxAmount: number;
  currency: string;
  status: string;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showDeleteUser, setShowDeleteUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<NewUserForm>();
  const { register: registerEdit, handleSubmit: handleSubmitEdit, formState: { errors: errorsEdit }, reset: resetEdit, setValue } = useForm<EditUserForm>();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message);
      toast.error('Error al cargar usuarios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchUsers();
    }
  }, [user, token]);

  const onSubmitNewUser = async (data: NewUserForm) => {
    try {
      const newUser = {
        employeeId: data.employeeId,
        email: data.email,
        password: data.password,
        profile: {
          firstName: data.firstName,
          lastName: data.lastName,
          position: data.position,
          department: data.department,
          location: data.location,
          phone: data.phone || ''
        },
        permissions: {
          role: data.role,
          approvalLimits: {
            maxAmount: data.maxAmount,
            currency: data.currency
          }
        }
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        let errorMessage = 'Error al crear usuario';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('Backend error data:', errorData);
        } catch (jsonError) {
          console.error('Failed to parse error JSON:', jsonError);
          // If JSON parsing fails, use a generic message or response text
          errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      toast.success('Usuario creado exitosamente');
      setShowAddUser(false);
      reset();
      fetchUsers(); // Refresh user list
    } catch (err: any) {
      console.error('Error creating user:', err);
      toast.error('Error al crear usuario: ' + err.message);
    }
  };

  const onSubmitEditUser = async (data: EditUserForm) => {
    if (!selectedUser) return;

    try {
      const updatedUser = {
        employeeId: data.employeeId,
        email: data.email,
        profile: {
          firstName: data.firstName,
          lastName: data.lastName,
          position: data.position,
          department: data.department,
          location: data.location,
          phone: data.phone || ''
        },
        permissions: {
          role: data.role,
          approvalLimits: {
            maxAmount: data.maxAmount,
            currency: data.currency
          }
        },
        status: data.status
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedUser)
      });

      if (!response.ok) {
        let errorMessage = 'Error al actualizar usuario';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('Backend error data:', errorData);
        } catch (jsonError) {
          console.error('Failed to parse error JSON:', jsonError);
          errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      toast.success('Usuario actualizado exitosamente');
      setShowEditUser(false);
      setSelectedUser(null);
      resetEdit();
      fetchUsers(); // Refresh user list
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast.error('Error al actualizar usuario: ' + err.message);
    }
  };

  const onDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${selectedUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errorMessage = 'Error al eliminar usuario';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('Backend error data:', errorData);
        } catch (jsonError) {
          console.error('Failed to parse error JSON:', jsonError);
          errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      toast.success('Usuario eliminado exitosamente');
      setShowDeleteUser(false);
      setSelectedUser(null);
      fetchUsers(); // Refresh user list
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error('Error al eliminar usuario: ' + err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.profile.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.profile.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    const colors = {
      'technical_field': 'bg-blue-100 text-blue-800',
      'supervisor_mantenimiento': 'bg-green-100 text-green-800',
      'jefe_mantenimiento': 'bg-purple-100 text-purple-800',
      'superintendent_operaciones': 'bg-orange-100 text-orange-800',
      'gerente_abastecimientos': 'bg-teal-100 text-teal-800',
      'gerente_financiero': 'bg-red-100 text-red-800',
      'gerente_general': 'bg-amber-100 text-amber-800',
      'admin': 'bg-gray-700 text-white'
    };
    return colors[role as keyof typeof colors] || 'bg-slate-100 text-slate-800';
  };

  const getRoleName = (role: string) => {
    const names = {
      'technical_field': 'Técnico de Campo',
      'supervisor_mantenimiento': 'Supervisor Mantenimiento',
      'jefe_mantenimiento': 'Jefe Mantenimiento',
      'superintendent_operaciones': 'Superintendent Operaciones',
      'gerente_abastecimientos': 'Gerente Abastecimientos',
      'gerente_financiero': 'Gerente Financiero',
      'gerente_general': 'Gerente General',
      'admin': 'Administrador'
    };
    return names[role as keyof typeof names] || role;
  };

  // Check if current user has permission to manage users
  const canManageUsers = user?.permissions.role === 'admin';

  if (!canManageUsers) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <Shield className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Acceso Restringido</h2>
          <p className="text-red-600">No tiene permisos para acceder a la gestión de usuarios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
          <p className="text-slate-600 mt-1">Administrar usuarios y permisos del sistema</p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Add User Modal/Form */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-2xl w-full relative">
            <button
              onClick={() => setShowAddUser(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Crear Nuevo Usuario
            </h2>
            <form onSubmit={handleSubmit(onSubmitNewUser)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ID Empleado *</label>
                  <input
                    type="text"
                    {...register('employeeId', { required: 'ID de empleado es requerido' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.employeeId && <p className="text-red-500 text-sm">{errors.employeeId.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    {...register('email', { required: 'Email es requerido' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña *</label>
                <input
                  type="password"
                  {...register('password', { required: 'Contraseña es requerida', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
                {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    {...register('firstName', { required: 'Nombre es requerido' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    {...register('lastName', { required: 'Apellido es requerido' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cargo *</label>
                  <input
                    type="text"
                    {...register('position', { required: 'Cargo es requerido' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.position && <p className="text-red-500 text-sm">{errors.position.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Departamento *</label>
                  <select
                    {...register('department', { required: 'Departamento es requerido' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Mantenimiento Mina">Mantenimiento Mina</option>
                    <option value="Operaciones">Operaciones</option>
                    <option value="Planta">Planta</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Administración">Administración</option>
                  </select>
                  {errors.department && <p className="text-red-500 text-sm">{errors.department.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación *</label>
                  <input
                    type="text"
                    {...register('location', { required: 'Ubicación es requerida' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    {...register('phone')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rol *</label>
                  <select
                    {...register('role', { required: 'Rol es requerido' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="technical_field">Técnico de Campo</option>
                    <option value="supervisor_mantenimiento">Supervisor Mantenimiento</option>
                    <option value="jefe_mantenimiento">Jefe Mantenimiento</option>
                    <option value="superintendent_operaciones">Superintendent Operaciones</option>
                    <option value="gerente_abastecimientos">Gerente Abastecimientos</option>
                    <option value="gerente_financiero">Gerente Financiero</option>
                    <option value="gerente_general">Gerente General</option>
                    <option value="admin">Administrador</option>
                  </select>
                  {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Límite Aprobación (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('maxAmount', { required: 'Límite de aprobación es requerido', min: 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.maxAmount && <p className="text-red-500 text-sm">{errors.maxAmount.message}</p>}
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg flex items-center"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal/Form */}
      {showEditUser && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-2xl w-full relative">
            <button
              onClick={() => {
                setShowEditUser(false);
                setSelectedUser(null);
                resetEdit();
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Edit className="w-5 h-5 mr-2" />
              Editar Usuario
            </h2>
            <form onSubmit={handleSubmitEdit(onSubmitEditUser)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ID Empleado *</label>
                  <input
                    type="text"
                    {...registerEdit('employeeId', { required: 'ID de empleado es requerido' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {errorsEdit.employeeId && <p className="text-red-500 text-sm">{errorsEdit.employeeId.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    {...registerEdit('email', { required: 'Email es requerido' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {errorsEdit.email && <p className="text-red-500 text-sm">{errorsEdit.email.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    {...registerEdit('firstName', { required: 'Nombre es requerido' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {errorsEdit.firstName && <p className="text-red-500 text-sm">{errorsEdit.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    {...registerEdit('lastName', { required: 'Apellido es requerido' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {errorsEdit.lastName && <p className="text-red-500 text-sm">{errorsEdit.lastName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cargo *</label>
                  <input
                    type="text"
                    {...registerEdit('position', { required: 'Cargo es requerido' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {errorsEdit.position && <p className="text-red-500 text-sm">{errorsEdit.position.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Departamento *</label>
                  <select
                    {...registerEdit('department', { required: 'Departamento es requerido' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Mantenimiento Mina">Mantenimiento Mina</option>
                    <option value="Operaciones">Operaciones</option>
                    <option value="Planta">Planta</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Administración">Administración</option>
                  </select>
                  {errorsEdit.department && <p className="text-red-500 text-sm">{errorsEdit.department.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ubicación *</label>
                  <input
                    type="text"
                    {...registerEdit('location', { required: 'Ubicación es requerida' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {errorsEdit.location && <p className="text-red-500 text-sm">{errorsEdit.location.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    {...registerEdit('phone')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rol *</label>
                  <select
                    {...registerEdit('role', { required: 'Rol es requerido' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="technical_field">Técnico de Campo</option>
                    <option value="supervisor_mantenimiento">Supervisor Mantenimiento</option>
                    <option value="jefe_mantenimiento">Jefe Mantenimiento</option>
                    <option value="superintendent_operaciones">Superintendent Operaciones</option>
                    <option value="gerente_abastecimientos">Gerente Abastecimientos</option>
                    <option value="gerente_financiero">Gerente Financiero</option>
                    <option value="gerente_general">Gerente General</option>
                    <option value="admin">Administrador</option>
                  </select>
                  {errorsEdit.role && <p className="text-red-500 text-sm">{errorsEdit.role.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Límite Aprobación (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...registerEdit('maxAmount', { required: 'Límite de aprobación es requerido', min: 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  {errorsEdit.maxAmount && <p className="text-red-500 text-sm">{errorsEdit.maxAmount.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado *</label>
                <select
                  {...registerEdit('status', { required: 'Estado es requerido' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="suspended">Suspendido</option>
                </select>
                {errorsEdit.status && <p className="text-red-500 text-sm">{errorsEdit.status.message}</p>}
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUser(false);
                    setSelectedUser(null);
                    resetEdit();
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

      {/* Delete User Confirmation Modal */}
      {showDeleteUser && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full relative text-center">
            <button
              onClick={() => {
                setShowDeleteUser(false);
                setSelectedUser(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-4">Confirmar Eliminación</h2>
            <p className="text-slate-600 mb-6">
              ¿Está seguro de que desea eliminar al usuario <strong>{selectedUser.profile.firstName} {selectedUser.profile.lastName} ({selectedUser.email})</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setShowDeleteUser(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={onDeleteUser}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <button 
            onClick={() => console.log('Filtros clicked')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Filtros
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-slate-500">Cargando usuarios...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">Error: {error}</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-slate-600">Usuario</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600">Rol</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600">Departamento</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600">Límite Aprobación</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600">Estado</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600">Último Acceso</th>
                  <th className="text-left py-3 px-6 font-medium text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.profile?.firstName?.charAt(0) || ''}{user.profile?.lastName?.charAt(0) || ''}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-slate-800">
                            {user.profile?.firstName} {user.profile?.lastName}
                          </p>
                          <p className="text-slate-500 text-sm">{user.email}</p>
                          <p className="text-slate-400 text-xs">{user.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRoleColor(user.permissions.role)}`}>
                        {getRoleName(user.permissions.role)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-slate-800">{user.profile?.department}</p>
                        <p className="text-slate-500 text-sm">{user.profile?.position}</p>
                        <p className="text-slate-400 text-xs">{user.profile?.location}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-800 font-medium">
                        ${user.permissions.approvalLimits.maxAmount.toLocaleString()} {user.permissions.approvalLimits.currency}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        {user.status === 'active' ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                            <span className="text-green-600 font-medium">Activo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-600 mr-2" />
                            <span className="text-red-600 font-medium">Inactivo</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-600 text-sm">
                        {new Date(user.lastLogin).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditUser(true);
                            setValue('employeeId', user.employeeId);
                            setValue('email', user.email);
                            setValue('firstName', user.profile.firstName);
                            setValue('lastName', user.profile.lastName);
                            setValue('position', user.profile.position);
                            setValue('department', user.profile.department);
                            setValue('location', user.profile.location);
                            setValue('phone', user.profile.phone || '');
                            setValue('role', user.permissions.role);
                            setValue('maxAmount', user.permissions.approvalLimits.maxAmount);
                            setValue('currency', user.permissions.approvalLimits.currency);
                            setValue('status', user.status);
                          }}
                          className="text-slate-600 hover:text-slate-800 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteUser(true);
                          }}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Total Usuarios</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Usuarios Activos</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Supervisores</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {users.filter(u => u.permissions.role.includes('supervisor') || u.permissions.role.includes('manager')).length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Técnicos</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {users.filter(u => u.permissions.role === 'technical_field').length}
              </p>
            </div>
            <Settings className="w-8 h-8 text-amber-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;