import {
  EmployeeRow,
  parseEmployeesCsvRows,
  buildEmployeeAnalytics,
  buildDailySeries,
} from '../utils.js';

interface EmployeesProps {
  rows: EmployeeRow[];
  warnings: string[];
  onRowsLoaded(rows: EmployeeRow[], warnings: string[]): void;
}

function useEmployeeChart(
  data: Array<{ date: string; parts: number; defects: number }>,
) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const chartRef = React.useRef<any>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!data.length) {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const config = {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [
          {
            label: 'Выработка (шт.)',
            data: data.map(d => d.parts),
            yAxisID: 'y1',
            borderColor: '#3273dc',
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.2,
          },
          {
            label: 'Дефекты (шт.)',
            data: data.map(d => d.defects),
            yAxisID: 'y2',
            borderColor: '#ff3860',
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y1: {
            type: 'linear',
            position: 'left',
            ticks: { beginAtZero: true },
            title: { display: true, text: 'Выработка' },
          },
          y2: {
            type: 'linear',
            position: 'right',
            ticks: { beginAtZero: true },
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Дефекты' },
          },
        },
        plugins: {
          legend: { display: true },
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
  }, [data]);

  return canvasRef;
}

export function Employees({ rows, warnings, onRowsLoaded }: EmployeesProps) {
  const analytics = React.useMemo(() => buildEmployeeAnalytics(rows), [rows]);
  const [shiftFilter, setShiftFilter] = React.useState('all');
  const [employeeFilter, setEmployeeFilter] = React.useState('all');
  const [loadingDemo, setLoadingDemo] = React.useState(false);

  const shifts = React.useMemo(() => {
    const set = new Set<string>();
    rows.forEach(row => {
      if (row.shift) set.add(row.shift);
    });
    return Array.from(set).sort();
  }, [rows]);

  const employees = React.useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach(row => {
      if (!map.has(row.id)) {
        map.set(row.id, row.name);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    return rows.filter(row => {
      if (shiftFilter !== 'all' && row.shift !== shiftFilter) return false;
      if (employeeFilter !== 'all' && row.id !== employeeFilter) return false;
      return true;
    });
  }, [rows, shiftFilter, employeeFilter]);

  const filteredAnalytics = React.useMemo(
    () => buildEmployeeAnalytics(filteredRows),
    [filteredRows],
  );

  const aggregatedEmployees = React.useMemo(() => {
    const groups = Object.values(filteredAnalytics.byEmployee);
    const entries = groups.map(group => {
      const totalParts = group.reduce((sum, row) => sum + row.parts_made, 0);
      const totalDefects = group.reduce((sum, row) => sum + row.defects, 0);
      const { id, name } = group[0];
      return { id, name, totalParts, totalDefects };
    });
    return entries.sort((a, b) => b.totalParts - a.totalParts);
  }, [filteredAnalytics]);

  const chartData = React.useMemo(
    () => buildDailySeries(filteredAnalytics, shiftFilter, employeeFilter),
    [filteredAnalytics, shiftFilter, employeeFilter],
  );

  const canvasRef = useEmployeeChart(chartData);

  function handleFileChange(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result: any) => {
        const parsed = parseEmployeesCsvRows(result.data);
        setShiftFilter('all');
        setEmployeeFilter('all');
        onRowsLoaded(parsed.rows, parsed.warnings);
      },
      error: (err: any) => alert('Ошибка при чтении CSV работников: ' + err.message),
    });
  }

  async function handleLoadDemo() {
    try {
      setLoadingDemo(true);
      const response = await fetch('./data/employees.csv');
      const text = await response.text();
      const result = Papa.parse(text, { header: true, skipEmptyLines: true });
      const parsed = parseEmployeesCsvRows(result.data);
      setShiftFilter('all');
      setEmployeeFilter('all');
      onRowsLoaded(parsed.rows, parsed.warnings);
    } catch (err: any) {
      console.error(err);
      alert('Не удалось загрузить демо-файл работников');
    } finally {
      setLoadingDemo(false);
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="box">
          <h2 className="title is-5">Загрузка данных по работникам</h2>
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
            Ожидаемые колонки: id, name, shift, parts_made, defects, avg_temp, avg_vib,
            avg_wear, date
          </p>
          <div className="buttons mt-3">
            <button
              className={`button is-link ${loadingDemo ? 'is-loading' : ''}`}
              onClick={handleLoadDemo}
              type="button"
            >
              Загрузить демо-данные
            </button>
          </div>
          {warnings.length > 0 && (
            <article className="message is-warning mt-3">
              <div className="message-header">
                <p>Предупреждения</p>
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

        <div className="columns is-multiline">
          <div className="column is-one-quarter-desktop is-half-tablet">
            <div className="box has-text-centered">
              <p className="heading">Всего сотрудников</p>
              <p className="title is-4">{analytics.totalEmployees || '—'}</p>
            </div>
          </div>
          <div className="column is-one-quarter-desktop is-half-tablet">
            <div className="box has-text-centered">
              <p className="heading">На смене сейчас</p>
              <p className="title is-4">{analytics.currentShiftCount || '—'}</p>
            </div>
          </div>
          <div className="column is-one-quarter-desktop is-half-tablet">
            <div className="box has-text-centered">
              <p className="heading">Всего произведено</p>
              <p className="title is-4">{analytics.totalParts || '—'}</p>
            </div>
          </div>
          <div className="column is-one-quarter-desktop is-half-tablet">
            <div className="box has-text-centered">
              <p className="heading">Дефекты, %</p>
              <p className="title is-4">
                {analytics.totalParts ? `${analytics.defectRate.toFixed(2)} %` : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="box">
          <div className="columns is-variable is-4 is-multiline">
            <div className="column is-4-desktop is-6-tablet">
              <label className="label is-small">Фильтр по смене</label>
              <div className="select is-fullwidth">
                <select value={shiftFilter} onChange={e => setShiftFilter(e.target.value)}>
                  <option value="all">Все смены</option>
                  {shifts.map(shift => (
                    <option key={shift} value={shift}>
                      {shift}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="column is-4-desktop is-6-tablet">
              <label className="label is-small">Фильтр по сотруднику</label>
              <div className="select is-fullwidth">
                <select
                  value={employeeFilter}
                  onChange={e => setEmployeeFilter(e.target.value)}
                >
                  <option value="all">Все сотрудники</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="table is-fullwidth is-striped is-hoverable">
              <thead>
                <tr>
                  <th>Сотрудник</th>
                  <th className="has-text-right">Выработка</th>
                  <th className="has-text-right">Дефекты</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedEmployees.map(entry => (
                  <tr key={entry.id}>
                    <td>{entry.name}</td>
                    <td className="has-text-right">{entry.totalParts}</td>
                    <td className="has-text-right">{entry.totalDefects}</td>
                  </tr>
                ))}
                {!aggregatedEmployees.length && (
                  <tr>
                    <td colSpan={3} className="has-text-centered has-text-grey">
                      Нет данных для выбранных фильтров
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="box" style={{ height: '320px' }}>
            {chartData.length ? (
              <canvas ref={canvasRef} />
            ) : (
              <p className="has-text-grey">
                Выберите файл или демо-данные, чтобы увидеть динамику по датам
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
