import {
  ProcessRow,
  ProcessRowWithRisk,
  ProcessAnalytics,
  Thresholds,
  parseProcessCsvRows,
  buildProcessCsvExport,
  triggerCsvDownload,
} from '../utils';

interface DashboardProps {
  analytics: ProcessAnalytics;
  thresholds: Thresholds;
  warnings: string[];
  onRowsLoaded(rows: ProcessRow[], warnings: string[]): void;
}

function makeChartConfig(rows: ProcessRowWithRisk[]) {
  const labels = rows.map(row => row.ts ?? String(row.index + 1));
  return {
    labels,
    datasets: [
      {
        label: 'Температура (°C)',
        data: rows.map(r => r.t),
        yAxisID: 'y1',
        borderWidth: 2,
        pointRadius: 0,
        borderColor: '#e76f51',
        tension: 0.2,
      },
      {
        label: 'Вибрация (м/с²)',
        data: rows.map(r => r.v),
        yAxisID: 'y1',
        borderWidth: 2,
        pointRadius: 0,
        borderColor: '#2a9d8f',
        tension: 0.2,
      },
      {
        label: 'Износ (%)',
        data: rows.map(r => r.w),
        yAxisID: 'y1',
        borderWidth: 2,
        pointRadius: 0,
        borderColor: '#264653',
        tension: 0.2,
      },
      {
        label: 'Риск брака (p)',
        data: rows.map(r => r.p),
        yAxisID: 'y2',
        borderWidth: 2,
        pointRadius: 0,
        borderColor: '#f4a261',
        tension: 0.2,
      },
    ],
  };
}

function useChart(rows: ProcessRowWithRisk[]) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (!canvasRef.current) return;
    if (!rows.length) {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      return;
    }
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const config = {
      type: 'line',
      data: makeChartConfig(rows),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y1: {
            type: 'linear',
            position: 'left',
            ticks: { beginAtZero: true },
            title: { display: true, text: 'Показатели процесса' },
          },
          y2: {
            type: 'linear',
            position: 'right',
            min: 0,
            max: 1,
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Риск брака (p)' },
          },
        },
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true },
        },
      },
    };
    if (chartRef.current) {
      chartRef.current.data = config.data;
      chartRef.current.update();
    } else {
      chartRef.current = new Chart(ctx, config);
    }
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [rows]);

  return canvasRef;
}

export function Dashboard({ analytics, thresholds, warnings, onRowsLoaded }: DashboardProps) {
  const { rows, alerts, latest, avgP } = analytics;
  const canvasRef = useChart(rows);
  const [loadingDemo, setLoadingDemo] = React.useState(false);

  function handleFileChange(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result: any) => {
        const parsed = parseProcessCsvRows(result.data);
        onRowsLoaded(parsed.rows, parsed.warnings);
      },
      error: (err: any) => {
        alert('Ошибка при чтении CSV: ' + err.message);
      },
    });
  }

  async function handleLoadDemo() {
    try {
      setLoadingDemo(true);
      const response = await fetch('./data/demo_data.csv');
      const text = await response.text();
      const result = Papa.parse(text, { header: true, skipEmptyLines: true });
      const parsed = parseProcessCsvRows(result.data);
      onRowsLoaded(parsed.rows, parsed.warnings);
    } catch (err: any) {
      console.error(err);
      alert('Не удалось загрузить демо-данные');
    } finally {
      setLoadingDemo(false);
    }
  }

  function handleExport() {
    if (!rows.length) {
      alert('Нет данных для экспорта');
      return;
    }
    const csv = buildProcessCsvExport(rows, thresholds);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    triggerCsvDownload(`process-report-${stamp}.csv`, csv);
  }

  return (
    <section className="section">
      <div className="container">
        <div className="columns is-variable is-6">
          <div className="column is-6">
            <div className="box">
              <h2 className="title is-5">Загрузка измерений процесса</h2>
              <div className="file has-name is-fullwidth">
                <label className="file-label">
                  <input
                    className="file-input"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                  />
                  <span className="file-cta">
                    <span className="file-icon">
                      <i className="fas fa-upload" />
                    </span>
                    <span className="file-label">Выберите CSV…</span>
                  </span>
                  <span className="file-name">
                    {rows.length ? `Записей: ${rows.length}` : 'Файл не выбран'}
                  </span>
                </label>
              </div>
              <p className="help">
                Ожидаемые колонки: temperature/температура, vibration/вибрация, wear/износ,
                defect/брак, machine/станок (опционально), time/timestamp (опционально)
              </p>
              <div className="buttons mt-3">
                <button
                  className={`button is-link ${loadingDemo ? 'is-loading' : ''}`}
                  onClick={handleLoadDemo}
                  type="button"
                >
                  Загрузить демо-данные
                </button>
                <button className="button is-light" type="button" onClick={handleExport}>
                  Экспорт отчёта CSV
                </button>
              </div>
              {warnings.length > 0 && (
                <article className="message is-warning mt-3">
                  <div className="message-header">
                    <p>Предупреждения при парсинге</p>
                  </div>
                  <div className="message-body">
                    <ul>
                      {warnings.map((warn, idx) => (
                        <li key={idx}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              )}
            </div>
          </div>
          <div className="column is-6">
            <div className="box">
              <h2 className="title is-5">Пороговые значения</h2>
              <div className="content is-small">
                <p>
                  <strong>T критическое:</strong> {thresholds.T_crit} °C<br />
                  <strong>V критическое:</strong> {thresholds.V_crit} м/с²<br />
                  <strong>W критическое:</strong> {thresholds.W_crit} %<br />
                  <strong>p критическое:</strong> {thresholds.p_crit}
                </p>
                <p>Настройки можно изменить во вкладке «Настройки».</p>
              </div>
            </div>
          </div>
        </div>

        <div className="columns">
          <div className="column">
            <div className="box has-text-centered">
              <p className="heading">Температура</p>
              <p className="title is-4">{latest ? `${latest.t.toFixed(2)} °C` : '—'}</p>
            </div>
          </div>
          <div className="column">
            <div className="box has-text-centered">
              <p className="heading">Вибрация</p>
              <p className="title is-4">{latest ? `${latest.v.toFixed(3)} м/с²` : '—'}</p>
            </div>
          </div>
          <div className="column">
            <div className="box has-text-centered">
              <p className="heading">Износ</p>
              <p className="title is-4">{latest ? `${latest.w.toFixed(1)} %` : '—'}</p>
            </div>
          </div>
          <div className="column">
            <div className="box has-text-centered">
              <p className="heading">Риск брака (средний)</p>
              <p className="title is-4">{rows.length ? `${(avgP * 100).toFixed(1)} %` : '—'}</p>
            </div>
          </div>
        </div>

        <div className="box" style={{ height: '360px' }}>
          {rows.length ? (
            <canvas ref={canvasRef} />
          ) : (
            <p className="has-text-grey">Загрузите CSV, чтобы увидеть графики</p>
          )}
        </div>

        <div className="box">
          <h3 className="title is-6">Экстренные уведомления</h3>
          {!alerts.length && (
            <p className="has-text-grey">Критические события не обнаружены</p>
          )}
          {alerts.length > 0 && (
            <ul>
              {alerts.slice(-8).reverse().map(alert => (
                <li key={alert.index}>
                  {alert.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
