import { Component, DestroyRef, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../core/layout/header/header.component';
import { SparklineComponent } from '../../shared/components/sparkline/sparkline.component';
import { BarChartComponent } from '../../shared/components/bar-chart/bar-chart.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ClientService } from '../../core/services/client.service';
import { PaymentService } from '../../core/services/payment.service';
import { GymService } from '../../core/services/gym.service';
import type { KpiCard, ActivityItem } from '../../core/models';

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, SparklineComponent, BarChartComponent, AvatarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private clientService  = inject(ClientService);
  private paymentService = inject(PaymentService);
  private gymService     = inject(GymService);
  private destroyRef     = inject(DestroyRef);

  readonly loading      = computed(() => this.clientService.loading() || this.paymentService.loading());
  readonly pendingCount = computed(() => this.clientService.overdueClients().length);
  readonly pendingTotal = computed(() => this.clientService.overdueClients().reduce((s, c) => s + (c.monthlyFee ?? 0), 0));

  readonly pageSubtitle = computed(() => {
    const name = this.gymService.gym()?.name ?? '';
    const now  = new Date();
    const month = MONTHS_ES[now.getMonth()];
    return name ? `${name} · ${month} ${now.getFullYear()}` : `${month} ${now.getFullYear()}`;
  });

  readonly accumulatedLabel = computed(() => {
    const total = this.paymentService.totalIncome();
    const year  = new Date().getFullYear();
    const fmt   = (n: number) => n >= 1_000_000 ? '₡' + (n / 1_000_000).toFixed(2) + 'M'
                                : n >= 1_000     ? '₡' + (n / 1_000).toFixed(0) + 'K'
                                : '₡' + n.toLocaleString('es-CR');
    return `${year} · ${fmt(total)} acumulado`;
  });

  readonly skeletonKpis = Array(4);

  readonly kpis = computed<KpiCard[]>(() => {
    const activos   = this.clientService.activeClients().length;
    const morosos   = this.clientService.overdueClients().length;
    const pending   = morosos;
    const pendAmt   = this.clientService.overdueClients().reduce((s, c) => s + (c.monthlyFee ?? 0), 0);
    const monthly   = this.paymentService.incomeByMonth();
    const curIdx    = new Date().getMonth();
    const curMonth  = monthly[curIdx]  ?? 0;
    const prevMonth = monthly[curIdx - 1] ?? 0;
    const delta     = prevMonth > 0 ? ((curMonth - prevMonth) / prevMonth * 100).toFixed(1) : '0';

    return [
      {
        label: 'Ingresos del mes',
        value: '₡' + curMonth.toLocaleString('es-CR'),
        delta: (Number(delta) >= 0 ? '+' : '') + delta + '%',
        deltaType: Number(delta) >= 0 ? 'ok' : 'warn',
        sparkData: monthly.map(v => Math.round(v / 1000)),
      },
      {
        label: 'Clientes activos',
        value: String(activos),
        delta: morosos > 0 ? `${morosos} morosos` : 'Al día',
        deltaType: morosos > 0 ? 'warn' : 'ok',
        sparkData: undefined,
      },
      {
        label: 'Asistencia prom.',
        value: this.clientService.clients().length > 0
          ? Math.round(
              this.clientService.clients().reduce((s, c) => s + c.attendanceThisMonth, 0)
              / this.clientService.clients().length,
            ) + ' días'
          : '—',
        delta: '',
        deltaType: 'neutral',
        sparkData: undefined,
      },
      {
        label: 'Pagos pendientes',
        value: String(pending),
        delta: '₡' + pendAmt.toLocaleString('es-CR'),
        deltaType: pending > 0 ? 'danger' : 'ok',
        sparkData: undefined,
      },
    ];
  });

  readonly overdueList = computed(() => this.clientService.overdueClients().slice(0, 5));
  readonly incomeData      = computed(() => this.paymentService.incomeByMonth().map(v => Math.round(v / 1000)));
  readonly incomeLabels    = ['E','F','M','A','M','J','J','A','S','O','N','D'];

  readonly activity = computed<ActivityItem[]>(() =>
    this.paymentService.paidPayments().slice(0, 8).map(p => ({
      who:    p.clientName,
      action: 'pagó membresía',
      time:   this.relativeTime(p.date),
      type:   'payment' as const,
    }))
  );

  activeChartRange     = 'Año';
  notificationAudience = 'todos';
  notificationMessage  = '';

  readonly audienceOptions = [
    { value: 'todos',   label: 'Todos los clientes' },
    { value: 'morosos', label: 'Solo morosos' },
    { value: 'mensual', label: 'Plan Mensual' },
  ];

  ngOnInit(): void {
    this.loadData();
    const onVisible = () => { if (document.visibilityState === 'visible') this.loadData(); };
    document.addEventListener('visibilitychange', onVisible);
    this.destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisible));
  }

  private loadData(): void {
    this.clientService.loadClients();
    this.paymentService.loadPayments();
  }

  daysLate(nextPayment: string): number {
    const diff = Date.now() - new Date(nextPayment).getTime();
    return Math.max(0, Math.floor(diff / 86_400_000));
  }

  getPillClass(type: string): string {
    const map: Record<string, string> = { ok: 'pill-ok', warn: 'pill-warn', danger: 'pill-danger', neutral: 'pill-neutral' };
    return map[type] ?? 'pill-neutral';
  }

  getActivityDot(type: string): string {
    const map: Record<string, string> = {
      payment: 'var(--accent)', workout: 'var(--ink-3)', checkin: 'var(--ink-3)',
      overdue: 'var(--danger)', routine: 'var(--ink-3)',
    };
    return map[type] ?? 'var(--ink-4)';
  }

  sendNotification(): void {
    if (!this.notificationMessage.trim()) return;
    alert(`Notificación enviada a: ${this.notificationAudience}\n\n"${this.notificationMessage}"`);
    this.notificationMessage = '';
  }

  private relativeTime(dateStr: string): string {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
    if (days === 0) return 'hoy';
    if (days === 1) return 'ayer';
    return `hace ${days} días`;
  }
}
