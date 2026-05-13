import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../core/layout/header/header.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { RegisterPaymentModalComponent } from '../../shared/components/register-payment-modal/register-payment-modal.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PaymentService } from '../../core/services/payment.service';
import { ClientService } from '../../core/services/client.service';
import { PlanService } from '../../core/services/plan.service';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, AvatarComponent, RegisterPaymentModalComponent, PaginationComponent],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss',
})
export class PaymentsComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private clientService  = inject(ClientService);
  private planService    = inject(PlanService);
  private destroyRef     = inject(DestroyRef);

  readonly loading   = this.paymentService.loading;
  readonly error     = this.paymentService.error;
  readonly skeletonRows = Array(6);

  readonly activeTab         = signal<'todos' | 'pendientes' | 'pagados'>('todos');
  readonly showRegisterModal = signal(false);
  readonly currentPage       = signal(1);
  readonly PAGE_SIZE         = 20;

  readonly filteredPayments = computed(() => {
    const tab = this.activeTab();
    const all = this.paymentService.payments();
    if (tab === 'pendientes') return all.filter(p => p.status !== 'pagado');
    if (tab === 'pagados')    return all.filter(p => p.status === 'pagado');
    return all;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredPayments().length / this.PAGE_SIZE))
  );

  readonly paginatedPayments = computed(() => {
    const page  = this.currentPage();
    const start = (page - 1) * this.PAGE_SIZE;
    return this.filteredPayments().slice(start, start + this.PAGE_SIZE);
  });

  readonly pageInfo = computed(() => {
    const total = this.filteredPayments().length;
    const page  = this.currentPage();
    const start = total === 0 ? 0 : (page - 1) * this.PAGE_SIZE + 1;
    const end   = Math.min(page * this.PAGE_SIZE, total);
    return { start, end, total };
  });

  setTab(tab: 'todos' | 'pendientes' | 'pagados'): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  prevPage(): void { this.currentPage.update(p => Math.max(1, p - 1)); }
  nextPage(): void { this.currentPage.update(p => Math.min(this.totalPages(), p + 1)); }

  readonly totalIncome  = this.paymentService.totalIncome;
  readonly pendingCount = this.paymentService.pendingCount;
  readonly pendingTotal = this.paymentService.pendingTotal;

  readonly paidCount = computed(() => this.paymentService.paidPayments().length);
  readonly collectRateNum = computed(() => {
    const total = this.paymentService.payments().length;
    const paid  = this.paymentService.paidPayments().length;
    return total > 0 ? (paid / total) * 100 : 0;
  });

  ngOnInit(): void {
    this.loadData();
    const onVisible = () => { if (document.visibilityState === 'visible') this.loadData(); };
    document.addEventListener('visibilitychange', onVisible);
    this.destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisible));
  }

  private loadData(): void {
    this.paymentService.loadPayments();
    this.clientService.loadClients();
    this.planService.loadPlans();
  }

  onPaymentRegistered(): void {
    this.paymentService.loadPayments();
  }

  retry(): void { this.paymentService.loadPayments(); }

  getPillClass(status: string): string {
    const map: Record<string, string> = { pagado: 'pill-ok', pendiente: 'pill-warn', vencido: 'pill-danger' };
    return map[status] ?? 'pill-neutral';
  }

  exportCSV(): void {
    const rows   = this.filteredPayments();
    const header = 'ID,Cliente,Monto,Fecha,Método,Concepto,Estado';
    const lines  = rows.map(p =>
      [p.id, p.clientName, p.amount, p.date, p.method, p.concept, p.status].join(',')
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a    = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob), download: 'pagos.csv',
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
