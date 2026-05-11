import { Component, Input, OnInit, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { ClientService } from '../../../../core/services/client.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { RoutineService } from '../../../../core/services/routine.service';
import { PlanService } from '../../../../core/services/plan.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ToastService } from '../../../../core/services/toast.service';
import { RegisterPaymentModalComponent } from '../../../../shared/components/register-payment-modal/register-payment-modal.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import type { Client, ProgressEntry, Payment, Routine, GymPlan } from '../../../../core/models';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe, AvatarComponent, RegisterPaymentModalComponent, DateInputComponent],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.scss',
})
export class ClientDetailComponent implements OnInit {
  @Input() client!: Client;
  @Output() close = new EventEmitter<void>();

  readonly clientService     = inject(ClientService);
  private paymentService     = inject(PaymentService);
  readonly routineService    = inject(RoutineService);
  private auth               = inject(AuthService);
  private notifService       = inject(NotificationService);
  private toast              = inject(ToastService);
  readonly planService       = inject(PlanService);

  activeTab: 'overview' | 'routine' | 'progress' = 'overview';

  readonly progress        = signal<ProgressEntry[]>([]);
  readonly loadingProgress = signal(false);

  // ── Registrar pago ────────────────────────────────────────────
  readonly showPaymentModal = signal(false);

  // ── Enviar notificación ───────────────────────────────────────
  readonly showNotifModal = signal(false);
  readonly notifCat       = signal<'info' | 'warning' | 'critical'>('info');
  readonly sendingNotif   = signal(false);
  notifTitle = '';
  notifBody  = '';

  readonly notifCats: { value: 'info' | 'warning' | 'critical'; label: string }[] = [
    { value: 'info',     label: 'Información' },
    { value: 'warning',  label: 'Aviso'       },
    { value: 'critical', label: 'Urgente'     },
  ];

  // ── Asignar rutina ────────────────────────────────────────────
  readonly assigningRoutine    = signal(false);
  readonly selectedRoutineId   = signal<string | null>(null);
  readonly savingRoutine       = signal(false);
  readonly routineError        = signal<string | null>(null);

  // ── Asignar membresía ─────────────────────────────────────────
  readonly assigningMembership = signal(false);
  readonly selectedPlanId      = signal<string | null>(null);
  readonly paymentMethod       = signal<'tarjeta' | 'transferencia' | 'efectivo'>('efectivo');
  readonly saving              = signal(false);
  readonly saveError           = signal<string | null>(null);
  startDate = new Date().toISOString().slice(0, 10);

  readonly selectedPlan = computed<GymPlan | undefined>(() =>
    this.planService.plans().find(p => p.id === this.selectedPlanId())
  );

  readonly paymentMethods: Array<'tarjeta' | 'transferencia' | 'efectivo'> = [
    'tarjeta', 'transferencia', 'efectivo',
  ];

  get clientPayments(): Payment[] {
    return this.paymentService.payments().filter(p => p.clientId === this.client.id);
  }

  get routine(): Routine | undefined {
    return this.client.assignedRoutine
      ? this.routineService.getById(this.client.assignedRoutine)
      : undefined;
  }

  ngOnInit(): void {
    this.loadProgress();
    if (!this.routineService.routines().length) this.routineService.loadRoutines();
  }

  private async loadProgress(): Promise<void> {
    this.loadingProgress.set(true);
    const entries = await this.clientService.loadClientProgress(this.client.id);
    this.progress.set(entries);
    this.loadingProgress.set(false);
  }

  startAssigning(): void {
    this.selectedPlanId.set(this.planService.activePlans()[0]?.id ?? null);
    this.startDate = new Date().toISOString().slice(0, 10);
    this.paymentMethod.set('efectivo');
    this.saveError.set(null);
    this.assigningMembership.set(true);
  }

  cancelAssigning(): void {
    this.assigningMembership.set(false);
    this.saveError.set(null);
  }

  async confirmAssignment(): Promise<void> {
    const plan   = this.selectedPlan();
    const gymId  = this.auth.gymId();
    if (!plan || !gymId) return;

    this.saving.set(true);
    this.saveError.set(null);

    const { error } = await this.clientService.assignMembership(
      this.client.id,
      gymId,
      plan.id,
      this.startDate,
      plan.durationDays,
      plan.price,
      this.paymentMethod(),
    );

    this.saving.set(false);

    if (error) {
      this.saveError.set(error);
    } else {
      this.assigningMembership.set(false);
    }
  }

  startAssigningRoutine(): void {
    this.selectedRoutineId.set(this.client.assignedRoutine ?? null);
    this.routineError.set(null);
    this.assigningRoutine.set(true);
  }

  cancelAssigningRoutine(): void {
    this.assigningRoutine.set(false);
    this.routineError.set(null);
  }

  async confirmRoutineAssignment(): Promise<void> {
    const newId = this.selectedRoutineId();
    if (!newId) return;
    this.savingRoutine.set(true);
    this.routineError.set(null);

    if (this.client.assignedRoutine && this.client.assignedRoutine !== newId) {
      await this.routineService.unassignClient(this.client.assignedRoutine, this.client.id);
    }

    const { error } = await this.routineService.assignClient(newId, this.client.id);
    this.savingRoutine.set(false);

    if (error) {
      this.routineError.set(error);
    } else {
      this.clientService.loadClients();
      this.assigningRoutine.set(false);
      this.toast.success('Rutina asignada');
    }
  }

  openNotifModal(): void {
    this.notifTitle = '';
    this.notifBody  = '';
    this.notifCat.set('info');
    this.showNotifModal.set(true);
  }

  async sendNotification(): Promise<void> {
    const title = this.notifTitle.trim();
    if (!title) return;
    const gymId = this.auth.gymId();
    if (!gymId) return;

    this.sendingNotif.set(true);
    const { error } = await this.notifService.send(gymId, this.client.id, {
      cat:   this.notifCat(),
      from:  this.auth.displayName() || 'Owner',
      title,
      desc:  this.notifBody.trim(),
    });
    this.sendingNotif.set(false);

    if (error) {
      this.toast.error('Error al enviar: ' + error);
    } else {
      this.toast.success('Notificación enviada');
      this.showNotifModal.set(false);
    }
  }

  getPillClass(status: string): string {
    const map: Record<string, string> = {
      activo: 'pill-ok', moroso: 'pill-danger', inactivo: 'pill-neutral',
      pagado: 'pill-ok', pendiente: 'pill-warn', vencido: 'pill-danger',
    };
    return map[status] ?? 'pill-neutral';
  }
}
