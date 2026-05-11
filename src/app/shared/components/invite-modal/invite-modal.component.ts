import {
  Component, Input, Output, EventEmitter,
  inject, signal, computed, viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { QrCodeComponent } from '../qr-code/qr-code.component';
import { GymService } from '../../../core/services/gym.service';

@Component({
  selector: 'app-invite-modal',
  standalone: true,
  imports: [CommonModule, QrCodeComponent],
  templateUrl: './invite-modal.component.html',
  styleUrl: './invite-modal.component.scss',
})
export class InviteModalComponent {
  private gymService = inject(GymService);

  /** Cuando se provee un gymId, el modal opera en modo afiliación permanente. */
  @Input() gymId: string | null = null;
  @Output() close = new EventEmitter<void>();

  readonly gymName = computed(() => this.gymService.gym()?.name ?? 'Forja');

  // ── Modo afiliación ───────────────────────────────────────────
  readonly isAffiliationMode = computed(() => this.gymId !== null);
  readonly affiliationQrContent = computed(() =>
    this.gymId ? `gym_join:${this.gymId}` : ''
  );

  private readonly qrCodeRef = viewChild(QrCodeComponent);

  downloadQr(): void {
    this.qrCodeRef()?.downloadAsPng('qr-afiliacion-forja.png');
  }

  // ── Modo invitación (comportamiento original) ─────────────────
  readonly mode = signal<'signup' | 'login'>('signup');
  readonly copied = signal(false);
  readonly codeCopied = signal(false);

  readonly inviteCode = 'H4RK9P';
  readonly inviteUrl = 'https://forja.app/join/H4RK9P';

  readonly description = computed(() =>
    this.mode() === 'signup'
      ? 'El cliente escanea el código con la cámara de su celular y se registra automáticamente afiliado al gym.'
      : 'Para clientes ya registrados: escanean el código y entran a la app sin contraseña.'
  );

  readonly steps = computed(() =>
    this.mode() === 'signup'
      ? [
          'Pedile al cliente que abra la cámara o la app Forja.',
          'Que apunte al código QR de la izquierda.',
          'Completa nombre, correo y método de pago.',
        ]
      : [
          'Pedile al cliente que abra la cámara o la app Forja.',
          'Que apunte al código QR de la izquierda.',
          'Confirmá su identidad en el escáner.',
        ]
  );

  copyUrl(): void {
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1600);
  }

  copyCode(): void {
    this.codeCopied.set(true);
    setTimeout(() => this.codeCopied.set(false), 1600);
  }
}
