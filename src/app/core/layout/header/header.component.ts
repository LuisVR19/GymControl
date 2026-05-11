import { Component, inject, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { InviteModalComponent } from '../../../shared/components/invite-modal/invite-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, AvatarComponent, InviteModalComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() pageTitle = '';
  @Input() pageSubtitle = '';

  theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  showNotifications = false;

  readonly modalOpen = signal(false);
  readonly modalGymId = signal<string | null>(null);

  openInviteModal(): void {
    this.modalGymId.set(null);
    this.modalOpen.set(true);
  }

  openAffiliationQrModal(): void {
    this.modalGymId.set(this.auth.gymId());
    this.modalOpen.set(true);
  }

  notifications = [
    { text: 'Cliente 22 tiene pago vencido 17 días', time: 'hace 1h', read: false },
    { text: 'Cliente 14 vence hoy', time: 'hace 3h', read: false },
    { text: '3 nuevos check-ins registrados', time: 'hace 5h', read: true },
  ];

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAllRead(): void {
    this.notifications.forEach(n => n.read = true);
  }
}
