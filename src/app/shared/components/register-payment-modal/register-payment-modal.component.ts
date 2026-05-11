import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '../avatar/avatar.component';
import { DateInputComponent } from '../date-input/date-input.component';
import { PaymentService, type RegisterPaymentPayload } from '../../../core/services/payment.service';
import { ClientService } from '../../../core/services/client.service';
import { ToastService } from '../../../core/services/toast.service';
import type { Client, Payment } from '../../../core/models';

@Component({
  selector: 'app-register-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, DateInputComponent],
  templateUrl: './register-payment-modal.component.html',
  styleUrl: './register-payment-modal.component.scss',
})
export class RegisterPaymentModalComponent implements OnInit {
  // When provided the client selector is hidden and this client is pre-selected
  preselectedClient = input<Client | null>(null);

  closed     = output<void>();
  registered = output<void>();

  readonly clientService = inject(ClientService);
  private paymentService = inject(PaymentService);
  private toast          = inject(ToastService);

  readonly selectedClient = signal<Client | null>(null);
  readonly payMode        = signal<'plan' | 'custom' | null>(null);
  readonly customMonths   = signal(1);
  readonly submitting     = signal(false);
  readonly formError      = signal<string | null>(null);

  readonly clientHasPlan = computed(() => {
    const c = this.selectedClient();
    return !!c && !!c.plan && c.monthlyFee > 0;
  });

  readonly displayAmount = computed(() => {
    const c = this.selectedClient();
    const mode = this.payMode();
    if (!c || !mode) return 0;
    return c.monthlyFee * (mode === 'custom' ? this.customMonths() : 1);
  });

  form = {
    clientId:     '',
    membershipId: '',
    amount:       0,
    date:         new Date().toISOString().slice(0, 10),
    method:       'Efectivo' as Payment['method'],
    periodFrom:   '',
    periodTo:     '',
    note:         '',
    sendReceipt:  false,
  };

  ngOnInit(): void {
    const pre = this.preselectedClient();
    if (pre) {
      this.form.clientId = pre.id;
      this.selectedClient.set(pre);
      this.loadMembershipId(pre.id);
    }
  }

  private async loadMembershipId(clientId: string): Promise<void> {
    const mid = await this.clientService.getMembershipIdForClient(clientId);
    this.form.membershipId = mid ?? '';
    this.recalculate();
  }

  async onClientChange(): Promise<void> {
    const client = this.clientService.clients().find(c => c.id === this.form.clientId) ?? null;
    this.selectedClient.set(client);
    this.payMode.set(null);
    this.customMonths.set(1);
    this.form.amount = 0;
    if (!this.form.clientId) { this.form.membershipId = ''; return; }
    await this.loadMembershipId(this.form.clientId);
  }

  setPayMode(mode: 'plan' | 'custom'): void {
    this.payMode.set(mode);
    this.recalculate();
  }

  addMonths(delta: number): void {
    this.customMonths.update(m => Math.max(1, Math.min(24, m + delta)));
    this.recalculate();
  }

  private recalculate(): void {
    const client = this.selectedClient();
    if (!client || !this.payMode()) return;
    const months = this.payMode() === 'custom' ? this.customMonths() : 1;
    this.form.amount = client.monthlyFee * months;
    const from = new Date();
    const to   = new Date(from);
    to.setDate(to.getDate() + months * 30);
    this.form.periodFrom = from.toISOString().slice(0, 10);
    this.form.periodTo   = to.toISOString().slice(0, 10);
  }

  async submit(): Promise<void> {
    if (!this.form.membershipId) {
      this.formError.set('El cliente no tiene membresía activa');
      return;
    }
    this.submitting.set(true);
    this.formError.set(null);
    try {
      const payload: RegisterPaymentPayload = {
        membershipId: this.form.membershipId,
        amount:       this.form.amount,
        date:         this.form.date,
        method:       this.form.method,
        periodFrom:   this.form.periodFrom || undefined,
        periodTo:     this.form.periodTo   || undefined,
        note:         this.form.note       || undefined,
      };
      const { error } = await this.paymentService.registerPayment(payload);
      if (error) {
        this.formError.set(error);
        this.toast.error('Error al registrar pago: ' + error);
      } else {
        this.toast.success('Pago registrado correctamente');
        this.clientService.loadClients();
        this.registered.emit();
        this.closed.emit();
      }
    } finally {
      this.submitting.set(false);
    }
  }
}
