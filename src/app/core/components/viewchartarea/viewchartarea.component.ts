import {
  Component, Input, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef,
} from '@angular/core';
import { Chart, ChartData } from 'chart.js';

@Component({
  selector: 'viewchartarea',
  templateUrl: './viewchartarea.component.html',
  styleUrls: ['./viewchartarea.component.scss'],
})
export class ViewChartAreaComponent implements OnDestroy, OnChanges {
  @ViewChild('wrapper', { static: true }) el: ElementRef;
  @ViewChild('canvas', { static: true }) canvas: ElementRef;
  @Input() data: ChartData;

  chart: Chart;
  maxSources = 8;

  makeConfig(data: ChartData): Chart.ChartConfiguration {
    return {
      type: 'line',
      data,
      options: {
        responsive: true,
      },
    };
  }

  render(data: ChartData): Chart {
    return new Chart(
      this.canvas.nativeElement,
      this.makeConfig(data),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data) {
      if (changes.data.firstChange) {
        this.chart = this.render(changes.data.currentValue);
      } else if (this.chart) {
        this.chart.data = changes.data.currentValue;
        this.chart.update();
      }
    }
  }

  ngOnDestroy(): void {
    if (this.chart) this.chart.destroy();
  }
}
