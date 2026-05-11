import { Injectable } from '@angular/core';
import { Client, Payment, Routine, ActivityItem, KpiCard } from '../models';

@Injectable({ providedIn: 'root' })
export class MockDataService {

  readonly clients: Client[] = [
    { id:'c1',  name:'Cliente 1',  email:'cliente1@email.com',  phone:'8800-0001', plan:'Mensual',    status:'activo',  joinDate:'2025-01-10', nextPayment:'2026-06-01', monthlyFee:25000, attendanceThisMonth:18, assignedRoutine:'r1', weight:78.5, lastWorkout:'2026-04-29', progress:[{date:'Jan',weight:82},{date:'Feb',weight:80.5},{date:'Mar',weight:79},{date:'Abr',weight:78.5}] },
    { id:'c2',  name:'Cliente 2',  email:'cliente2@email.com',  phone:'8800-0002', plan:'Mensual',    status:'activo',  joinDate:'2025-02-15', nextPayment:'2026-06-01', monthlyFee:25000, attendanceThisMonth:12, assignedRoutine:'r1', weight:65.2, lastWorkout:'2026-04-28' },
    { id:'c3',  name:'Cliente 3',  email:'cliente3@email.com',  phone:'8800-0003', plan:'Trimestral', status:'activo',  joinDate:'2025-03-01', nextPayment:'2026-06-15', monthlyFee:25000, attendanceThisMonth:20, weight:90.1, lastWorkout:'2026-04-30' },
    { id:'c4',  name:'Cliente 4',  email:'cliente4@email.com',  phone:'8800-0004', plan:'Mensual',    status:'activo',  joinDate:'2025-01-20', nextPayment:'2026-06-01', monthlyFee:25000, attendanceThisMonth:8,  assignedRoutine:'r2', weight:72.0, lastWorkout:'2026-04-27' },
    { id:'c5',  name:'Cliente 5',  email:'cliente5@email.com',  phone:'8800-0005', plan:'Mensual',    status:'moroso',  joinDate:'2024-11-05', nextPayment:'2026-05-15', monthlyFee:25000, attendanceThisMonth:3,  weight:85.3, lastWorkout:'2026-04-10' },
    { id:'c6',  name:'Cliente 6',  email:'cliente6@email.com',  phone:'8800-0006', plan:'Anual',      status:'activo',  joinDate:'2025-06-01', nextPayment:'2027-06-01', monthlyFee:20000, attendanceThisMonth:22, assignedRoutine:'r1', weight:58.9, lastWorkout:'2026-04-30' },
    { id:'c7',  name:'Cliente 7',  email:'cliente7@email.com',  phone:'8800-0007', plan:'Mensual',    status:'activo',  joinDate:'2025-04-10', nextPayment:'2026-06-01', monthlyFee:25000, attendanceThisMonth:15, weight:68.4, lastWorkout:'2026-04-29' },
    { id:'c8',  name:'Cliente 8',  email:'cliente8@email.com',  phone:'8800-0008', plan:'Mensual',    status:'activo',  joinDate:'2025-05-20', nextPayment:'2026-06-01', monthlyFee:25000, attendanceThisMonth:10, assignedRoutine:'r2', weight:76.1, lastWorkout:'2026-04-28' },
    { id:'c9',  name:'Cliente 9',  email:'cliente9@email.com',  phone:'8800-0009', plan:'Semestral',  status:'activo',  joinDate:'2025-08-01', nextPayment:'2026-08-01', monthlyFee:22000, attendanceThisMonth:19, assignedRoutine:'r1', weight:81.7, lastWorkout:'2026-04-30' },
    { id:'c10', name:'Cliente 10', email:'cliente10@email.com', phone:'8800-0010', plan:'Mensual',    status:'moroso',  joinDate:'2025-02-28', nextPayment:'2026-05-08', monthlyFee:25000, attendanceThisMonth:2,  weight:95.0, lastWorkout:'2026-04-05' },
    { id:'c11', name:'Cliente 11', email:'cliente11@email.com', phone:'8800-0011', plan:'Mensual',    status:'activo',  joinDate:'2025-07-15', nextPayment:'2026-06-01', monthlyFee:25000, attendanceThisMonth:14, weight:62.3, lastWorkout:'2026-04-29' },
    { id:'c12', name:'Cliente 12', email:'cliente12@email.com', phone:'8800-0012', plan:'Trimestral', status:'activo',  joinDate:'2025-03-10', nextPayment:'2026-06-10', monthlyFee:25000, attendanceThisMonth:16, assignedRoutine:'r2', weight:73.8, lastWorkout:'2026-04-30' },
    { id:'c13', name:'Cliente 13', email:'cliente13@email.com', phone:'8800-0013', plan:'Mensual',    status:'inactivo',joinDate:'2024-09-01', nextPayment:'—',           monthlyFee:25000, attendanceThisMonth:0,  weight:70.0, lastWorkout:'2026-02-14' },
    { id:'c14', name:'Cliente 14', email:'cliente14@email.com', phone:'8800-0014', plan:'Mensual',    status:'moroso',  joinDate:'2025-01-15', nextPayment:'2026-05-08', monthlyFee:25000, attendanceThisMonth:5,  weight:88.2, lastWorkout:'2026-04-20' },
    { id:'c15', name:'Cliente 15', email:'cliente15@email.com', phone:'8800-0015', plan:'Anual',      status:'activo',  joinDate:'2025-11-01', nextPayment:'2026-11-01', monthlyFee:20000, attendanceThisMonth:21, assignedRoutine:'r1', weight:66.5, lastWorkout:'2026-04-30' },
  ];

  readonly routines: Routine[] = [
    {
      id: 'r1',
      name: 'Push / Pull / Legs · 5 días',
      description: 'Programa de hipertrofia para nivel intermedio. Enfoque en volumen progresivo.',
      createdAt: '2026-03-01',
      assignedTo: ['c1','c2','c6','c9','c15'],
      days: [
        { day: 'Lunes — Push (Pecho/Tríceps)', exercises: [
          { id:'e1', name:'Press banca plano', sets:4, reps:'8-12', rest:'90s' },
          { id:'e2', name:'Press inclinado mancuernas', sets:3, reps:'10-12', rest:'75s' },
          { id:'e3', name:'Aperturas en cable', sets:3, reps:'12-15', rest:'60s' },
          { id:'e4', name:'Fondos en paralelas', sets:3, reps:'10-12', rest:'75s' },
          { id:'e5', name:'Press francés barra EZ', sets:3, reps:'10-12', rest:'60s' },
          { id:'e6', name:'Extensión tríceps cable', sets:3, reps:'12-15', rest:'60s' },
        ]},
        { day: 'Martes — Pull (Espalda/Bíceps)', exercises: [
          { id:'e7',  name:'Dominadas pronadas', sets:4, reps:'6-10', rest:'90s' },
          { id:'e8',  name:'Remo con barra', sets:4, reps:'8-10', rest:'90s' },
          { id:'e9',  name:'Jalón al pecho', sets:3, reps:'10-12', rest:'75s' },
          { id:'e10', name:'Remo en polea baja', sets:3, reps:'10-12', rest:'75s' },
          { id:'e11', name:'Curl barra EZ', sets:3, reps:'10-12', rest:'60s' },
          { id:'e12', name:'Curl martillo mancuernas', sets:3, reps:'12-15', rest:'60s' },
        ]},
        { day: 'Miércoles — Legs (Tren inferior)', exercises: [
          { id:'e13', name:'Sentadilla libre', sets:4, reps:'8-10', rest:'120s' },
          { id:'e14', name:'Prensa 45°', sets:3, reps:'10-12', rest:'90s' },
          { id:'e15', name:'Extensión cuádriceps', sets:3, reps:'12-15', rest:'60s' },
          { id:'e16', name:'Curl femoral tumbado', sets:3, reps:'10-12', rest:'60s' },
          { id:'e17', name:'Elevación de gemelos de pie', sets:4, reps:'15-20', rest:'45s' },
        ]},
        { day: 'Jueves — Push (Hombros)', exercises: [
          { id:'e18', name:'Press militar mancuernas', sets:4, reps:'8-12', rest:'90s' },
          { id:'e19', name:'Elevaciones laterales', sets:4, reps:'12-15', rest:'60s' },
          { id:'e20', name:'Elevaciones frontales', sets:3, reps:'12-15', rest:'60s' },
          { id:'e21', name:'Pájaro en polea', sets:3, reps:'12-15', rest:'60s' },
        ]},
        { day: 'Viernes — Pull (Volumen)', exercises: [
          { id:'e22', name:'Jalón trasnuca', sets:3, reps:'10-12', rest:'75s' },
          { id:'e23', name:'Remo mancuerna un brazo', sets:3, reps:'10-12', rest:'60s' },
          { id:'e24', name:'Pull-over cable', sets:3, reps:'12-15', rest:'60s' },
          { id:'e25', name:'Curl concentrado', sets:3, reps:'12-15', rest:'60s' },
        ]},
      ],
    },
    {
      id: 'r2',
      name: 'Full Body · 3 días',
      description: 'Entrenamiento de cuerpo completo para principiantes y nivel básico.',
      createdAt: '2026-02-15',
      assignedTo: ['c4','c8','c12'],
      days: [
        { day: 'Día A', exercises: [
          { id:'f1', name:'Sentadilla goblet', sets:3, reps:'12-15', rest:'75s' },
          { id:'f2', name:'Press banca mancuernas', sets:3, reps:'10-12', rest:'75s' },
          { id:'f3', name:'Remo con mancuerna', sets:3, reps:'10-12', rest:'75s' },
          { id:'f4', name:'Plancha abdominal', sets:3, reps:'30-45s', rest:'60s' },
        ]},
        { day: 'Día B', exercises: [
          { id:'f5', name:'Peso muerto rumano', sets:3, reps:'10-12', rest:'90s' },
          { id:'f6', name:'Press militar sentado', sets:3, reps:'10-12', rest:'75s' },
          { id:'f7', name:'Jalón al pecho', sets:3, reps:'10-12', rest:'75s' },
          { id:'f8', name:'Crunch en polea', sets:3, reps:'15-20', rest:'60s' },
        ]},
        { day: 'Día C', exercises: [
          { id:'f9',  name:'Zancadas con mancuernas', sets:3, reps:'10-12/lado', rest:'75s' },
          { id:'f10', name:'Aperturas mancuernas plano', sets:3, reps:'12-15', rest:'60s' },
          { id:'f11', name:'Remo en máquina', sets:3, reps:'12-15', rest:'60s' },
          { id:'f12', name:'Elevaciones de piernas colgado', sets:3, reps:'12-15', rest:'60s' },
        ]},
      ],
    },
    {
      id: 'r3',
      name: 'Cardio + Funcional · 4 días',
      description: 'Combinación de trabajo cardiovascular y ejercicios funcionales para pérdida de grasa.',
      createdAt: '2026-04-01',
      assignedTo: [],
      days: [
        { day: 'Día 1', exercises: [
          { id:'g1', name:'Burpees', sets:4, reps:'10', rest:'60s' },
          { id:'g2', name:'Mountain climbers', sets:3, reps:'30s', rest:'45s' },
          { id:'g3', name:'Saltos al cajón', sets:3, reps:'8-10', rest:'60s' },
        ]},
        { day: 'Día 2', exercises: [
          { id:'g4', name:'Kettlebell swing', sets:4, reps:'15', rest:'60s' },
          { id:'g5', name:'Thruster barra', sets:3, reps:'10', rest:'75s' },
        ]},
      ],
    },
  ];

  readonly payments: Payment[] = [
    { id:'p1',  clientId:'c7',  clientName:'Cliente 7',  amount:25000, date:'2026-04-30', method:'Tarjeta',      concept:'Mensual',    status:'pagado', periodFrom:'2026-05-01', periodTo:'2026-05-31' },
    { id:'p2',  clientId:'c12', clientName:'Cliente 12', amount:25000, date:'2026-04-28', method:'Transferencia',concept:'Mensual',    status:'pagado', periodFrom:'2026-05-01', periodTo:'2026-05-31' },
    { id:'p3',  clientId:'c3',  clientName:'Cliente 3',  amount:70000, date:'2026-04-25', method:'Efectivo',     concept:'Trimestral', status:'pagado', periodFrom:'2026-05-01', periodTo:'2026-07-31' },
    { id:'p4',  clientId:'c6',  clientName:'Cliente 6',  amount:20000, date:'2026-04-20', method:'Tarjeta',      concept:'Anual',      status:'pagado', periodFrom:'2026-05-01', periodTo:'2027-04-30' },
    { id:'p5',  clientId:'c1',  clientName:'Cliente 1',  amount:25000, date:'2026-04-18', method:'Tarjeta',      concept:'Mensual',    status:'pagado', periodFrom:'2026-05-01', periodTo:'2026-05-31' },
    { id:'p6',  clientId:'c11', clientName:'Cliente 11', amount:25000, date:'2026-04-15', method:'Efectivo',     concept:'Mensual',    status:'pagado', periodFrom:'2026-05-01', periodTo:'2026-05-31' },
    { id:'p7',  clientId:'c9',  clientName:'Cliente 9',  amount:22000, date:'2026-04-12', method:'Transferencia',concept:'Semestral',  status:'pagado', periodFrom:'2026-05-01', periodTo:'2026-10-31' },
    { id:'p8',  clientId:'c22', clientName:'Cliente 22', amount:25000, date:'—',          method:'Tarjeta',      concept:'Mensual',    status:'vencido', daysLate:17 },
    { id:'p9',  clientId:'c14', clientName:'Cliente 14', amount:25000, date:'—',          method:'Efectivo',     concept:'Mensual',    status:'vencido', daysLate:10 },
    { id:'p10', clientId:'c31', clientName:'Cliente 31', amount:25000, date:'—',          method:'Transferencia',concept:'Mensual',    status:'pendiente', daysLate:6 },
    { id:'p11', clientId:'c5',  clientName:'Cliente 5',  amount:25000, date:'—',          method:'Tarjeta',      concept:'Mensual',    status:'pendiente', daysLate:3 },
    { id:'p12', clientId:'c10', clientName:'Cliente 10', amount:25000, date:'—',          method:'Efectivo',     concept:'Mensual',    status:'vencido', daysLate:8 },
    { id:'p13', clientId:'c18', clientName:'Cliente 18', amount:25000, date:'—',          method:'Tarjeta',      concept:'Mensual',    status:'pendiente', daysLate:2 },
    { id:'p14', clientId:'c25', clientName:'Cliente 25', amount:25000, date:'—',          method:'Transferencia',concept:'Mensual',    status:'vencido', daysLate:5 },
  ];

  readonly activity: ActivityItem[] = [
    { who:'Cliente 7',  action:'pagó membresía',      time:'hace 12 min', type:'payment' },
    { who:'Cliente 12', action:'completó entreno',    time:'hace 28 min', type:'workout' },
    { who:'Cliente 3',  action:'check-in',            time:'hace 41 min', type:'checkin' },
    { who:'Cliente 22', action:'pago vencido',        time:'hace 1 h',    type:'overdue' },
    { who:'Cliente 9',  action:'rutina asignada',     time:'hace 2 h',    type:'routine' },
    { who:'Cliente 18', action:'completó entreno',    time:'hace 3 h',    type:'workout' },
    { who:'Cliente 1',  action:'registró peso 78.5kg',time:'hace 4 h',    type:'workout' },
    { who:'Cliente 15', action:'check-in',            time:'hace 5 h',    type:'checkin' },
  ];

  readonly incomeData = [620000, 680000, 720000, 690000, 810000, 890000, 950000, 920000, 1020000, 1080000, 1100000, 1180000];
  readonly incomeLabels = ['E','F','M','A','M','J','J','A','S','O','N','D'];

  getKpis(): KpiCard[] {
    return [
      { label:'Ingresos del mes', value:'₡3.180.000', delta:'+12.4%',    deltaType:'ok',     sparkData:[620,680,720,690,810,890,950,920,1020,1080,1100,1180] },
      { label:'Clientes activos', value:'124',         delta:'+8',        deltaType:'ok',     sparkData:[110,112,115,118,120,122,124] },
      { label:'Asistencia (mes)', value:'78%',         delta:'−3%',       deltaType:'warn',   sparkData:[82,80,79,76,78,77,78] },
      { label:'Pagos pendientes', value:'7',           delta:'₡175.000',  deltaType:'danger', sparkData:null as any },
    ];
  }

  getClientById(id: string): Client | undefined {
    return this.clients.find(c => c.id === id);
  }

  getPendingPayments(): Payment[] {
    return this.payments.filter(p => p.status !== 'pagado');
  }

  getPaidPayments(): Payment[] {
    return this.payments.filter(p => p.status === 'pagado');
  }

  getClientsByStatus(status: string): Client[] {
    if (status === 'all') return this.clients;
    return this.clients.filter(c => c.status === status);
  }

  formatCurrency(amount: number): string {
    return '₡' + amount.toLocaleString('es-CR');
  }
}
