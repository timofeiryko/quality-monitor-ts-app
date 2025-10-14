/*
 * Main entrypoint for the quality monitoring demo.
 *
 * This file defines a small React application that loads data from a CSV,
 * computes a simple quality risk index based on temperature, vibration
 * and wear, and visualises the data using Chart.js.  It relies on
 * React, ReactDOM, Chart.js and PapaParse being available on the
 * global window object – the HTML page includes them via CDN links.
 *
 * Because we cannot install npm packages in this environment, we
 * compile this TypeScript to JavaScript with tsc and load it from
 * index.html.  The compiled output will refer to global variables
 * (React, ReactDOM, Chart, Papa) which are provided by the UMD
 * distributions loaded in the page.  See public/index.html for
 * details.
 */

// Declare globals provided by the HTML page.  These declarations
// prevent TypeScript from complaining that the variables do not
// exist.  They have type `any` because the actual types are not
// available in this environment.
declare const React: any;
declare const ReactDOM: any;
declare const Chart: any;
declare const Papa: any;

// A simple interface representing a single observation row.
interface DataRow {
  t: number;        // temperature
  v: number;        // vibration
  w: number;        // wear
  defect?: number;  // 0 or 1, optional
  machine?: string; // optional machine identifier
  p?: number;       // computed probability of defect
}

/**
 * Compute scaled values and a risk estimate for each row.
 *
 * The function normalises temperature, vibration and wear to the
 * [0,1] interval using min–max scaling over the entire dataset.  It
 * then computes a weighted sum Q = 0.87·T + 0.45·V + 0.32·W and
 * applies a logistic transformation to map the result into (0,1).
 * Finally the risk p is assigned back onto each row.
 *
 * @param rows Array of DataRow to augment with p values
 */
function computeRisk(rows: DataRow[]): void {
  if (!rows.length) return;
  const ts = rows.map(r => r.t);
  const vs = rows.map(r => r.v);
  const ws = rows.map(r => r.w);
  const minT = Math.min(...ts);
  const maxT = Math.max(...ts);
  const minV = Math.min(...vs);
  const maxV = Math.max(...vs);
  const minW = Math.min(...ws);
  const maxW = Math.max(...ws);
  const scale = (min: number, max: number, x: number) => {
    const span = max - min;
    return span === 0 ? 0 : (x - min) / span;
  };
  for (const r of rows) {
    const scaledT = scale(minT, maxT, r.t);
    const scaledV = scale(minV, maxV, r.v);
    const scaledW = scale(minW, maxW, r.w);
    // Weighted sum as per the document.  We subtract 0.5 to shift the
    // centre and multiply by 2 to widen the range before applying
    // logistic; this makes the output better spread between 0 and 1.
    const q = 0.87 * scaledT + 0.45 * scaledV + 0.32 * scaledW;
    const logistic = (x: number) => 1 / (1 + Math.exp(-2 * (x - 0.5)));
    r.p = logistic(q);
  }
}

/**
 * Convert raw objects from PapaParse into DataRow objects.  The
 * headers may be in Russian or English.  Invalid rows (missing
 * numbers) are skipped.
 */
function normaliseRows(rawRows: any[]): DataRow[] {
  const norm = (s: string): string => (s || '').toString().trim().toLowerCase();
  const result: DataRow[] = [];
  for (const row of rawRows) {
    // Normalise header keys to lower case for matching
    const o: any = {};
    for (const k in row) {
      o[norm(k)] = row[k];
    }
    const t = parseFloat(o['temperature'] ?? o['температура']);
    const v = parseFloat(o['vibration'] ?? o['вибрация']);
    const w = parseFloat(o['wear'] ?? o['износ']);
    if (isNaN(t) || isNaN(v) || isNaN(w)) continue;
    const defectStr = o['defect'] ?? o['брак'];
    const defect = defectStr !== undefined && defectStr !== '' ? Number(defectStr) : undefined;
    const machine = o['machine'] ?? o['станок'];
    result.push({ t, v, w, defect, machine });
  }
  return result;
}

/**
 * The main React component.  It manages state for the loaded
 * observations, the Chart.js instance and computed alerts.
 */
function App() {
  // Initialise state without using generic type arguments.  We cast
  // explicitly to DataRow[] and any to avoid issues with React
  // functions being untyped in this environment.
  const [rows, setRows] = React.useState([] as DataRow[]);
  const [alerts, setAlerts] = React.useState([] as DataRow[]);
  const canvasRef = React.useRef(null as HTMLCanvasElement | null);
  const chartRef = React.useRef(null as any);

  // Recompute the chart and alerts whenever the rows array changes.
  React.useEffect(() => {
    if (!rows.length) return;
    // Compute risk values for each row (in-place)
    computeRisk(rows);
    // Derive alerts (last 8 exceeding thresholds)
    const thresholdAlerts = rows.filter(r => {
      return (r.p ?? 0) > 0.7 || r.v > 0.25 || r.t > 28 || r.w > 60;
    });
    setAlerts(thresholdAlerts.slice(-8));
    // Prepare data for Chart.js
    const labels = rows.map((_, i) => String(i + 1));
    const tData = rows.map(r => r.t);
    const vData = rows.map(r => r.v);
    const wData = rows.map(r => r.w);
    const pData = rows.map(r => (r.p ?? 0));
    const datasets = [
      { label: 'Temperature (°C)', data: tData, yAxisID: 'y1', borderWidth: 1, pointRadius: 0, tension: 0.2 },
      { label: 'Vibration (m/s²)', data: vData, yAxisID: 'y1', borderWidth: 1, pointRadius: 0, tension: 0.2 },
      { label: 'Wear (%)', data: wData, yAxisID: 'y1', borderWidth: 1, pointRadius: 0, tension: 0.2 },
      { label: 'Risk p', data: pData, yAxisID: 'y2', borderWidth: 1, pointRadius: 0, tension: 0.2 },
    ];
    const data = { labels, datasets };
    const config = {
      type: 'line',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y1: { type: 'linear', position: 'left', ticks: { beginAtZero: true } },
          y2: { type: 'linear', position: 'right', min: 0, max: 1, grid: { drawOnChartArea: false } },
        },
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true },
        },
      },
    };
    // Create or update the chart
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    if (chartRef.current) {
      chartRef.current.data = data;
      chartRef.current.update();
    } else {
      chartRef.current = new Chart(ctx, config);
    }
  }, [rows]);

  // Handler for file uploads.  Uses PapaParse to read and parse the CSV
  function handleFileChange(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const newRows = normaliseRows(results.data);
        setRows(newRows);
      },
      error: (err: any) => {
        alert('Ошибка при чтении CSV: ' + err.message);
      },
    });
  }

  // Compute KPI values from current rows
  const latest = rows[rows.length - 1];
  const avgP = rows.reduce((sum, r) => sum + (r.p ?? 0), 0) / (rows.length || 1);

  return React.createElement(
    'div',
    { className: 'container' },
    // Heading
    React.createElement('h1', { className: 'title is-4' }, 'Мониторинг качества — демо'),
    // File input
    React.createElement(
      'div',
      { className: 'box' },
      React.createElement(
        'div',
        { className: 'file has-name is-fullwidth' },
        React.createElement('label', { className: 'file-label' },
          React.createElement('input', { className: 'file-input', type: 'file', accept: '.csv,.txt', onChange: handleFileChange }),
          React.createElement('span', { className: 'file-cta' },
            React.createElement('span', { className: 'file-icon' },
              React.createElement('i', { className: 'fas fa-upload' }),
            ),
            React.createElement('span', { className: 'file-label' }, 'Выберите CSV…'),
          ),
          React.createElement('span', { className: 'file-name' }, 'Загрузить данные'),
        ),
      ),
      React.createElement('p', { className: 'help' }, 'Ожидаемые колонки: temperature/температура, vibration/вибрация, wear/износ, defect/брак (опционально), machine/станок (опционально)')
    ),
    // KPI cards
    React.createElement('div', { className: 'columns' },
      React.createElement('div', { className: 'column' },
        React.createElement('div', { className: 'box has-text-centered' },
          React.createElement('p', { className: 'heading' }, 'Температура'),
          React.createElement('p', { className: 'title is-4' }, latest ? `${latest.t.toFixed(2)} °C` : '—')
        )
      ),
      React.createElement('div', { className: 'column' },
        React.createElement('div', { className: 'box has-text-centered' },
          React.createElement('p', { className: 'heading' }, 'Вибрация'),
          React.createElement('p', { className: 'title is-4' }, latest ? `${latest.v.toFixed(3)} м/с²` : '—')
        )
      ),
      React.createElement('div', { className: 'column' },
        React.createElement('div', { className: 'box has-text-centered' },
          React.createElement('p', { className: 'heading' }, 'Износ'),
          React.createElement('p', { className: 'title is-4' }, latest ? `${latest.w.toFixed(1)} %` : '—')
        )
      ),
      React.createElement('div', { className: 'column' },
        React.createElement('div', { className: 'box has-text-centered' },
          React.createElement('p', { className: 'heading' }, 'Риск брака (p)'),
          React.createElement('p', { className: 'title is-4' }, rows.length ? `${(avgP * 100).toFixed(1)} %` : '—')
        )
      )
    ),
    // Chart container
    React.createElement('div', { className: 'box', style: { height: '300px' } },
      React.createElement('canvas', { ref: canvasRef })
    ),
    // Alerts section
    React.createElement('div', { className: 'box' },
      React.createElement('h2', { className: 'title is-6' }, 'Экстренные уведомления'),
      alerts.length === 0 ? React.createElement('p', { className: 'has-text-grey' }, 'Нет критических событий') :
        React.createElement('ul', {}, alerts.slice().reverse().map((r, idx) =>
          React.createElement('li', { key: idx },
            `⚠️ t=${r.t.toFixed(2)}°C · v=${r.v.toFixed(3)} м/с² · w=${r.w.toFixed(1)}% · p=${(r.p ?? 0).toFixed(2)}`
          )
        ))
    )
  );
}

// Mount the React application once the DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.render(React.createElement(App), root);
  }
});