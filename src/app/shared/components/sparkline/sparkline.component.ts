import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-sparkline',
  standalone: true,
  template: `
    @if (data().length) {
      <svg [attr.width]="width()" [attr.height]="height()" style="display:block;overflow:visible">
        @if (fill()) {
          <path [attr.d]="fillPath()" [attr.fill]="color()" fill-opacity="0.12"/>
        }
        <path [attr.d]="linePath()" [attr.stroke]="color()" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    }
  `,
})
export class SparklineComponent {
  data   = input<number[]>([]);
  width  = input(120);
  height = input(36);
  color  = input('currentColor');
  fill   = input(false);

  private points = computed(() => {
    const d = this.data(), w = this.width(), h = this.height();
    const min = Math.min(...d), max = Math.max(...d);
    const range = max - min || 1;
    return d.map((v, i) => [
      (i / (d.length - 1)) * w,
      h - ((v - min) / range) * (h - 4) - 2,
    ]);
  });

  linePath = computed(() => {
    return this.points().map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  });

  fillPath = computed(() => {
    const w = this.width(), h = this.height();
    return this.linePath() + ` L${w},${h} L0,${h} Z`;
  });
}
