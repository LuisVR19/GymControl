import {
  Component, Input, OnChanges, AfterViewInit,
  ViewChild, ElementRef,
} from '@angular/core';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [`canvas { display: block; border-radius: 4px; }`],
})
export class QrCodeComponent implements AfterViewInit, OnChanges {
  @Input() value = '';
  @Input() size = 200;

  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void { this.render(); }

  ngOnChanges(): void {
    if (this.canvasRef) this.render();
  }

  private render(): void {
    QRCode.toCanvas(this.canvasRef.nativeElement, this.value, {
      width: this.size,
      margin: 1,
      color: { dark: '#0E0E0C', light: '#FFFFFF' },
    });
  }

  async downloadAsPng(filename = 'qr-afiliacion.png'): Promise<void> {
    const dataUrl = await QRCode.toDataURL(this.value, {
      width: this.size * 3,
      margin: 2,
      color: { dark: '#0E0E0C', light: '#FFFFFF' },
    });
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = filename;
    anchor.click();
  }
}
