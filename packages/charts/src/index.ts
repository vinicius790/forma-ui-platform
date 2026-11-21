export interface ChartDataPoint { label: string; value: number }
export interface ChartSeries { id: string; name: string; points: readonly ChartDataPoint[] }

/** Maps a data value inside [min, max] to an audible pitch frequency in Hz (default C4 261.63Hz to C6 1046.50Hz) for chart sonification. */
export function valueToFrequencyHz(value: number, min: number, max: number, minHz = 261.63, maxHz = 1046.5): number {
  if (max <= min) return minHz;
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return Math.round(minHz * Math.pow(maxHz / minHz, ratio) * 100) / 100;
}

export function buildSparklineSvgPath(values: readonly number[], width = 200, height = 50): string {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, idx) => {
      const x = values.length === 1 ? width / 2 : (idx / (values.length - 1)) * width;
      const y = height - ((v - min) / span) * height;
      return `${idx === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export class ChartAccessibilityController {
  private seriesList: readonly ChartSeries[];
  private activeSeries = 0;
  private activePoint = 0;
  constructor(series: readonly ChartSeries[]) { this.seriesList = series; }
  get focusedCoord() { return { seriesIndex: this.activeSeries, pointIndex: this.activePoint }; }
  get currentAnnouncement(): string {
    const s = this.seriesList[this.activeSeries];
    const p = s?.points[this.activePoint];
    if (!s || !p) return 'Empty chart';
    return `${s.name}, ${p.label}: ${p.value}`;
  }
  handleKeyDown(e: Pick<KeyboardEvent, 'key' | 'preventDefault'>): void {
    const s = this.seriesList[this.activeSeries];
    if (!s) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); this.activePoint = Math.min(s.points.length - 1, this.activePoint + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); this.activePoint = Math.max(0, this.activePoint - 1); }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeSeries = Math.min(this.seriesList.length - 1, this.activeSeries + 1);
      this.activePoint = Math.min(this.activePoint, (this.seriesList[this.activeSeries]?.points.length ?? 1) - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeSeries = Math.max(0, this.activeSeries - 1);
      this.activePoint = Math.min(this.activePoint, (this.seriesList[this.activeSeries]?.points.length ?? 1) - 1);
    }
  }
  destroy(): void {}
}

export function createChartAccessibilityController(series: readonly ChartSeries[]): ChartAccessibilityController {
  return new ChartAccessibilityController(series);
}
