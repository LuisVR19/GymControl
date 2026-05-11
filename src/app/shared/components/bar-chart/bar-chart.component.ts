import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  template: `
    <svg [attr.width]="width()" [attr.height]="height()" style="display:block;width:100%">
      @for (item of bars(); track $index) {
        <g>
          <rect
            [attr.x]="item.x"
            [attr.y]="item.y"
            [attr.width]="item.bw"
            [attr.height]="item.bh"
            rx="3"
            [attr.fill]="color()"
            [attr.opacity]="item.opacity"
          />
          @if (labels()[$index]) {
            <text
              [attr.x]="item.x + item.bw / 2"
              [attr.y]="height() - 4"
              text-anchor="middle"
              font-family="var(--font-mono)"
              font-size="9"
              fill="var(--ink-3)"
            >{{ labels()[$index] }}</text>
          }
        </g>
      }
    </svg>
  `,
})
export class BarChartComponent {
  data   = input<number[]>([]);
  labels = input<string[]>([]);
  width  = input(300);
  height = input(140);
  color  = input('var(--ink)');

  bars = computed(() => {
    const d = this.data(), w = this.width(), h = this.height();
    const max = Math.max(...d) || 1;
    const bw = w / d.length;
    const pad = 4;
    return d.map((v, i) => ({
      x: i * bw + pad,
      y: h - ((v / max) * (h - 24)) - 18,
      bw: bw - pad * 2,
      bh: (v / max) * (h - 24),
      opacity: i === d.length - 1 ? 1 : 0.45,
    }));
  });
}
