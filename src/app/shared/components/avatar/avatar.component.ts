import { Component, Input, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar" [style.width.px]="size()" [style.height.px]="size()" [style.border-radius.px]="size()" [style.font-size.px]="size() * 0.38" [style.background]="bg()" [style.color]="fg()">
      {{ initials() }}
    </div>
  `,
  styles: [`
    .avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-weight: 600;
      flex-shrink: 0;
      user-select: none;
    }
  `],
})
export class AvatarComponent {
  name = input('??');
  size = input(36);

  initials = computed(() => {
    return this.name().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  });

  bg = computed(() => {
    const hue = (this.name().charCodeAt(0) * 7) % 360;
    return `oklch(0.88 0.06 ${hue})`;
  });

  fg = computed(() => {
    const hue = (this.name().charCodeAt(0) * 7) % 360;
    return `oklch(0.22 0.06 ${hue})`;
  });
}
