import { Component, DestroyRef, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../core/layout/header/header.component';
import { PlanService, type PlanPayload } from '../../core/services/plan.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import type { GymPlan } from '../../core/models';

interface MembershipForm {
  name: string;
  price: number;
  duration: number;
  unit: string;
  accessType: string;
  maxVisits: number;
  isActive: boolean;
  features: string[];
  color: string;
}

function daysToUnit(days: number): { duration: number; unit: string } {
  if (days % 365 === 0) return { duration: days / 365, unit: 'año' };
  if (days % 30  === 0) return { duration: days / 30,  unit: 'mes' };
  if (days % 7   === 0) return { duration: days / 7,   unit: 'semana' };
  return { duration: days, unit: 'día' };
}

function unitToDays(duration: number, unit: string): number {
  if (unit === 'año')    return duration * 365;
  if (unit === 'mes')    return duration * 30;
  if (unit === 'semana') return duration * 7;
  return duration;
}

@Component({
  selector: 'app-memberships',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './memberships.component.html',
  styleUrl: './memberships.component.scss',
})
export class MembershipsComponent implements OnInit {
  private planService = inject(PlanService);
  private auth        = inject(AuthService);
  private toast       = inject(ToastService);
  private destroyRef  = inject(DestroyRef);

  constructor() {
    effect(() => {
      const gymId = this.auth.gymId();
      untracked(() => {
        if (gymId && !this.planService.plans().length && !this.planService.loading()) {
          this.loadData();
        }
      });
    });
  }

  readonly plans   = this.planService.plans;
  readonly loading = this.planService.loading;
  readonly error   = this.planService.error;

  readonly showModal  = signal(false);
  readonly editingId  = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly isEditMode = computed(() => this.editingId() !== null);

  readonly skeletonCards = Array(4);

  readonly activePlanCount  = computed(() => this.plans().filter(p => p.isActive).length);
  readonly totalSubs        = computed(() => this.plans().reduce((s, p) => s + p.subscriberCount, 0));
  readonly monthlyRevenue   = computed(() =>
    this.plans()
      .filter(p => p.isActive)
      .reduce((s, p) => s + (p.subscriberCount * p.price / Math.max(1, p.durationDays / 30)), 0)
  );
  readonly topPlan = computed(() => {
    const ps = this.plans();
    if (!ps.length) return { name: '—', count: 0, pct: 0 };
    const top   = ps.reduce((a, b) => a.subscriberCount > b.subscriberCount ? a : b);
    const total = ps.reduce((s, p) => s + p.subscriberCount, 0);
    return { name: top.name, count: top.subscriberCount, pct: total > 0 ? Math.round(top.subscriberCount / total * 100) : 0 };
  });

  form: MembershipForm = this.emptyForm();

  readonly colorOptions = [
    { id: 'lime', value: 'oklch(0.85 0.18 130)' },
    { id: 'sand', value: 'oklch(0.82 0.08 80)'  },
    { id: 'sky',  value: 'oklch(0.82 0.10 230)' },
    { id: 'rose', value: 'oklch(0.80 0.10 20)'  },
    { id: 'ink',  value: '#0E0E0C'               },
  ];

  readonly unitOptions = ['día', 'semana', 'mes', 'año'];

  ngOnInit(): void {
    this.loadData();
    const onVisible = () => { if (document.visibilityState === 'visible') this.loadData(); };
    document.addEventListener('visibilitychange', onVisible);
    this.destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisible));
  }

  private loadData(): void {
    this.planService.loadPlans();
  }

  retry(): void { this.planService.loadPlans(); }

  colorValue(key: string): string {
    return this.colorOptions.find(c => c.id === key)?.value ?? 'oklch(0.85 0.18 130)';
  }

  durationLabel(days: number): string {
    const { duration, unit } = daysToUnit(days);
    const plural = duration > 1;
    if (unit === 'año')    return `${duration} año${plural ? 's' : ''}`;
    if (unit === 'mes')    return `${duration} mes${plural ? 'es' : ''}`;
    if (unit === 'semana') return `${duration} semana${plural ? 's' : ''}`;
    return `${duration} día${plural ? 's' : ''}`;
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.showModal.set(true);
  }

  openEdit(plan: GymPlan): void {
    this.editingId.set(plan.id);
    const { duration, unit } = daysToUnit(plan.durationDays);
    this.form = {
      name:       plan.name,
      price:      plan.price,
      duration,
      unit,
      accessType: plan.accessType,
      maxVisits:  plan.maxVisits ?? 12,
      isActive:   plan.isActive,
      features:   [...plan.features],
      color:      plan.color,
    };
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  async savePlan(): Promise<void> {
    if (!this.form.name.trim()) return;

    const gymId = this.auth.gymId();
    if (!gymId) return;

    const payload: PlanPayload = {
      name:         this.form.name.trim(),
      price:        this.form.price,
      durationDays: unitToDays(this.form.duration, this.form.unit),
      isActive:     this.form.isActive,
      color:        this.form.color,
      features:     this.form.features.filter(f => f.trim()),
      accessType:   this.form.accessType,
      maxVisits:    this.form.accessType === 'limited' ? this.form.maxVisits : null,
    };

    this.submitting.set(true);
    try {
      const id = this.editingId();
      if (id) {
        const { error } = await this.planService.updatePlan(id, payload);
        if (error) this.toast.error('Error al guardar: ' + error);
        else { this.toast.success('Membresía actualizada'); this.closeModal(); }
      } else {
        const { error } = await this.planService.createPlan(gymId, payload);
        if (error) this.toast.error('Error al crear: ' + error);
        else { this.toast.success('Membresía creada'); this.closeModal(); }
      }
    } finally {
      this.submitting.set(false);
    }
  }

  async confirmDelete(): Promise<void> {
    const id = this.editingId();
    if (!id || !confirm('¿Eliminar este plan? Los clientes con este plan activo no se verán afectados.')) return;
    this.submitting.set(true);
    try {
      const { error } = await this.planService.deletePlan(id);
      if (error) this.toast.error('Error al eliminar: ' + error);
      else { this.toast.warn('Plan eliminado'); this.closeModal(); }
    } finally {
      this.submitting.set(false);
    }
  }

  async duplicate(plan: GymPlan, event: Event): Promise<void> {
    event.stopPropagation();
    const { error } = await this.planService.duplicatePlan(plan);
    if (error) { this.toast.error('Error al duplicar'); }
    else       { this.toast.info('Plan duplicado como borrador'); }
  }

  addFeature(): void   { this.form.features.push(''); }
  removeFeature(i: number): void { this.form.features.splice(i, 1); }

  trackByIndex = (i: number) => i;

  private emptyForm(): MembershipForm {
    return { name: '', price: 25000, duration: 1, unit: 'mes', accessType: 'unlimited', maxVisits: 12, isActive: true, features: [''], color: 'lime' };
  }
}
