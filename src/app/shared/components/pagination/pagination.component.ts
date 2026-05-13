import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    <div class="pagination">
      <button class="page-btn" (click)="prev.emit()" [disabled]="currentPage() === 1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <span class="page-info">
        Mostrando {{ pageInfo().start }}–{{ pageInfo().end }} de {{ pageInfo().total }}
      </span>
      <button class="page-btn" (click)="next.emit()" [disabled]="currentPage() === totalPages()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  `,
  styles: [`
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 14px 22px;
      border-top: 1px solid var(--line);
    }

    .page-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: var(--bg-elev);
      color: var(--ink-2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.12s, color 0.12s;

      &:hover:not(:disabled) { background: var(--bg-sunk); color: var(--ink); }
      &:disabled { opacity: 0.35; cursor: not-allowed; }
    }

    .page-info {
      font-size: 12px;
      color: var(--ink-3);
      min-width: 160px;
      text-align: center;
    }
  `],
})
export class PaginationComponent {
  currentPage = input.required<number>();
  totalPages  = input.required<number>();
  pageInfo    = input.required<{ start: number; end: number; total: number }>();

  prev = output<void>();
  next = output<void>();
}
