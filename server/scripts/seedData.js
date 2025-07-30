console.log('Starting seedData.js script...');

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import PurchaseRequest from '../models/PurchaseRequest.js';
import connectDB from '../config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedUsers = async () => {
  console.log('🌱 Seeding users...');
  
  const users = [
    {
      employeeId: 'EMP-2025-001',
      email: 'supervisor@minera.com',
      password: 'password123',
      profile: {
        firstName: 'Carlos',
        lastName: 'López',
        position: 'Supervisor de Mantenimiento',
        department: 'Mantenimiento Mina',
        location: 'Operación Tajo Norte',
        phone: '+51-999-888-777'
      },
      permissions: {
        role: 'supervisor_mantenimiento',
        approvalLimits: {
          maxAmount: 10000,
          currency: 'USD',
          categories: ['critical_spare', 'consumable']
        },
        areas: ['maintenance', 'mobile_equipment'],
        specialPermissions: ['emergency_approval']
      }
    },
    {
      employeeId: 'EMP-2025-002',
      email: 'manager@minera.com',
      password: 'password123',
      profile: {
        firstName: 'Ana',
        lastName: 'García',
        position: 'Jefe de Mantenimiento',
        department: 'Mantenimiento Mina',
        location: 'Oficina Central',
        phone: '+51-888-777-666'
      },
      permissions: {
        role: 'jefe_mantenimiento',
        approvalLimits: {
          maxAmount: 50000,
          currency: 'USD',
          categories: ['critical_spare', 'consumable', 'new_equipment']
        },
        areas: ['maintenance', 'mobile_equipment', 'fixed_plant'],
        specialPermissions: ['emergency_approval', 'budget_override', 'user_management']
      }
    },
    {
      employeeId: 'EMP-2025-007',
      email: 'admin@minera.com',
      password: 'password123',
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        position: 'Administrador del Sistema',
        department: 'Administración',
        location: 'Oficina Principal',
        phone: '+51-111-222-333'
      },
      permissions: {
        role: 'admin',
        approvalLimits: {
          maxAmount: Number.MAX_SAFE_INTEGER,
          currency: 'USD',
          categories: ['critical_spare', 'consumable', 'new_equipment', 'specialized_service', 'dangerous_material']
        },
        areas: ['maintenance', 'operations', 'mobile_equipment', 'fixed_plant', 'services'],
        specialPermissions: ['emergency_approval', 'budget_override', 'vendor_evaluation', 'user_management']
      }
    },
    {
      employeeId: 'EMP-2025-003',
      email: 'tecnico@minera.com',
      password: 'password123',
      profile: {
        firstName: 'Juan',
        lastName: 'Pérez',
        position: 'Técnico Mecánico Senior',
        department: 'Mantenimiento Mina',
        location: 'Pit 1 - Level 2400',
        phone: '+51-777-666-555'
      },
      permissions: {
        role: 'technical_field',
        approvalLimits: {
          maxAmount: 0,
          currency: 'USD',
          categories: []
        },
        areas: ['maintenance'],
        specialPermissions: []
      }
    },
    {
      employeeId: 'EMP-2025-004',
      email: 'superintendent@minera.com',
      password: 'password123',
      profile: {
        firstName: 'Roberto',
        lastName: 'Silva',
        position: 'Superintendent de Operaciones',
        department: 'Operaciones',
        location: 'Centro de Control',
        phone: '+51-666-555-444'
      },
      permissions: {
        role: 'superintendent_operaciones',
        approvalLimits: {
          maxAmount: 100000,
          currency: 'USD',
          categories: ['critical_spare', 'consumable', 'new_equipment', 'specialized_service']
        },
        areas: ['operations', 'maintenance', 'mobile_equipment', 'fixed_plant'],
        specialPermissions: ['emergency_approval']
      }
    },
    {
      employeeId: 'EMP-2025-005',
      email: 'financial@minera.com',
      password: 'password123',
      profile: {
        firstName: 'María',
        lastName: 'Rodríguez',
        position: 'Gerente Financiero',
        department: 'Administración',
        location: 'Oficina Lima',
        phone: '+51-555-444-333'
      },
      permissions: {
        role: 'gerente_financiero',
        approvalLimits: {
          maxAmount: 500000,
          currency: 'USD',
          categories: ['critical_spare', 'consumable', 'new_equipment', 'specialized_service', 'dangerous_material']
        },
        areas: ['services'],
        specialPermissions: ['budget_override', 'user_management']
      }
    },
    {
      employeeId: 'EMP-2025-006',
      email: 'general@minera.com',
      password: 'password123',
      profile: {
        firstName: 'Eduardo',
        lastName: 'Mendoza',
        position: 'Gerente General',
        department: 'Administración',
        location: 'Oficina Principal',
        phone: '+51-444-333-222'
      },
      permissions: {
        role: 'gerente_general',
        approvalLimits: {
          maxAmount: Number.MAX_SAFE_INTEGER,
          currency: 'USD',
          categories: ['critical_spare', 'consumable', 'new_equipment', 'specialized_service', 'dangerous_material']
        },
        areas: ['maintenance', 'operations', 'mobile_equipment', 'fixed_plant', 'services'],
        specialPermissions: ['emergency_approval', 'budget_override', 'vendor_evaluation', 'user_management']
      }
    }
  ];

  for (const userData of users) {
    try {
      console.log(`Attempting to create user: ${userData.email}`);
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${userData.email}`);
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }
};

const seedSampleRequests = async () => {
  console.log('🌱 Seeding sample purchase requests...');
  
  console.log('Searching for technical_field user...');
  const techUser = await User.findOne({ 'permissions.role': 'technical_field' });
  console.log('Searching for supervisor_maintenance user...');
  const supervisor = await User.findOne({ 'permissions.role': 'supervisor_mantenimiento' });
  console.log('Searching for maintenance_manager user...');
  const manager = await User.findOne({ 'permissions.role': 'jefe_mantenimiento' });
  
  console.log(`Tech User found: ${!!techUser}`);
  console.log(`Supervisor found: ${!!supervisor}`);
  console.log(`Manager found: ${!!manager}`);

  if (!techUser || !supervisor || !manager) {
    console.log('⚠️  Required users not found for sample requests. Skipping sample request seeding.');
    return;
  }

  const sampleRequests = [
    {
      requestor: {
        userId: techUser._id,
        name: `${techUser.profile.firstName} ${techUser.profile.lastName}`,
        role: techUser.permissions.role,
        department: techUser.profile.department,
        location: techUser.profile.location
      },
      requestDetails: {
        itemType: 'critical_spare',
        description: 'Bomba hidráulica para excavadora CAT 390F - Falla crítica en sistema principal',
        specifications: {
          partNumber: 'CAT-7Y-1234',
          brand: 'Caterpillar',
          model: '390F',
          quantity: 2,
          unitOfMeasure: 'units',
          technicalSpecs: 'Presión máxima 350 bar, caudal 180 l/min, compatible con aceite ISO VG 46'
        },
        criticality: 'critical',
        justification: 'Falla en bomba principal de excavadora CAT 390F. Equipo detenido desde las 06:00 hrs. Pérdida de producción estimada en $50,000 por día. Requiere reemplazo inmediato para continuar operaciones en Pit 1.',
        estimatedCost: 25000,
        currency: 'USD',
        requiredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        attachments: []
      },
      approvalFlow: [
        {
          level: 1,
          role: 'supervisor_mantenimiento',
          status: 'pending'
        },
        {
          level: 2,
          role: 'jefe_mantenimiento',
          status: 'pending'
        },
        {
          level: 3,
          role: 'superintendent_operaciones',
          status: 'pending'
        }
      ],
      metrics: {
        escalations: 0,
        slaCompliance: true
      },
      audit: {
        createdBy: techUser._id
      }
    },
    {
      requestor: {
        userId: techUser._id,
        name: `${techUser.profile.firstName} ${techUser.profile.lastName}`,
        role: techUser.permissions.role,
        department: techUser.profile.department,
        location: techUser.profile.location
      },
      requestDetails: {
        itemType: 'consumable',
        description: 'Aceite hidráulico Shell Tellus S2 M46 para mantenimiento preventivo',
        specifications: {
          partNumber: 'SHELL-T46-200L',
          brand: 'Shell',
          model: 'Tellus S2 M46',
          quantity: 10,
          unitOfMeasure: 'liters',
          technicalSpecs: 'Viscosidad ISO VG 46, temperatura operación -30°C a +100°C, aditivos anti-desgaste'
        },
        criticality: 'medium',
        justification: 'Reposición de stock para mantenimiento preventivo programado de equipos móviles. Stock actual: 50L, consumo mensual: 200L. Necesario para mantener programa de mantenimiento.',
        estimatedCost: 3500,
        currency: 'USD',
        requiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        attachments: []
      },
      approvalFlow: [
        {
          level: 1,
          role: 'supervisor_mantenimiento',
          userId: supervisor._id,
          userName: `${supervisor.profile.firstName} ${supervisor.profile.lastName}`,
          status: 'approved',
          comments: 'Stock necesario para mantenimiento preventivo. Aprobado según programa establecido.',
          actionDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          timeToAction: 7200
        }
      ],
      status: 'approved',
      metrics: {
        totalApprovalTime: 7200,
        escalations: 0,
        slaCompliance: true
      },
      audit: {
        createdBy: techUser._id,
        changeLog: [
          {
            field: 'approvalFlow',
            oldValue: 'pending',
            newValue: 'approved',
            changedBy: supervisor._id,
            changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            reason: 'Approved by supervisor_maintenance'
          }
        ]
      }
    },
    {
      requestor: {
        userId: techUser._id,
        name: `${techUser.profile.firstName} ${techUser.profile.lastName}`,
        role: techUser.permissions.role,
        department: techUser.profile.department,
        location: techUser.profile.location
      },
      requestDetails: {
        itemType: 'new_equipment',
        description: 'Equipo de soldadura portátil Lincoln Electric para reparaciones en campo',
        specifications: {
          partNumber: 'LIN-K3963-1',
          brand: 'Lincoln Electric',
          model: 'Ranger 330MPX',
          quantity: 1,
          unitOfMeasure: 'units',
          technicalSpecs: 'Soldadora multiproceso, 330A, motor Kohler, peso 295kg, incluye cables y accesorios'
        },
        criticality: 'high',
        justification: 'Equipo actual fuera de servicio por falla en generador. Necesario para reparaciones urgentes en campo y mantenimiento de estructuras. Sin este equipo, reparaciones deben realizarse en taller con pérdida de tiempo significativa.',
        estimatedCost: 45000,
        currency: 'USD',
        requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        attachments: []
      },
      approvalFlow: [
        {
          level: 1,
          role: 'supervisor_mantenimiento',
          userId: supervisor._id,
          userName: `${supervisor.profile.firstName} ${supervisor.profile.lastName}`,
          status: 'approved',
          comments: 'Equipo necesario para operaciones. Aprobado para continuar flujo.',
          actionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          timeToAction: 3600
        },
        {
          level: 2,
          role: 'jefe_mantenimiento',
          status: 'pending'
        },
        {
          level: 3,
          role: 'superintendent_operaciones',
          status: 'pending'
        }
      ],
      metrics: {
        escalations: 0,
        slaCompliance: true
      },
      audit: {
        createdBy: techUser._id,
        changeLog: [
          {
            field: 'approvalFlow',
            oldValue: 'pending',
            newValue: 'approved',
            changedBy: supervisor._id,
            changedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            reason: 'Approved by supervisor_maintenance'
          }
        ]
      }
    }
  ];

  for (const requestData of sampleRequests) {
    try {
      const request = new PurchaseRequest(requestData);
      await request.save();
      console.log(`✅ Created sample request: ${request.requestNumber}`);
    } catch (error) {
      console.error(`❌ Error creating sample request:`, error.message);
    }
  }
};

const seedDatabase = async () => {
  try {
    console.log('🚀 Starting database seeding...');
    console.log('Attempting to connect to DB...');
    await connectDB();
    console.log('DB connected. Attempting to clear existing data...');
    await User.deleteMany({});
    console.log('Users cleared.');
    await PurchaseRequest.deleteMany({});
    console.log('Purchase requests cleared.');
    console.log(`✅ Existing users count after deletion: ${await User.countDocuments({})}`);
    console.log(`✅ Existing purchase requests count after deletion: ${await PurchaseRequest.countDocuments({})}`);
    console.log('✅ Existing data cleared.');
    
    await seedUsers();
    await seedSampleRequests();
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('👤 Technical Field: tecnico@minera.com / password123');
    console.log('👤 Supervisor: supervisor@minera.com / password123');
    console.log('👤 Manager: manager@minera.com / password123');
    console.log('👤 Superintendent: superintendent@minera.com / password123');
    console.log('👤 Financial Manager: financial@minera.com / password123');
    console.log('👤 General Manager: general@minera.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();