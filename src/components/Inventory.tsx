import {
  InventoryRow,
  parseInventoryCsvRows,
  analyseInventory,
} from '../utils.js';

interface InventoryProps {
  rows: InventoryRow[];
  warnings: string[];
  onRowsLoaded(rows: InventoryRow[], warnings: string[]): void;
}

export function Inventory({ rows, warnings, onRowsLoaded }: InventoryProps) {
  const analysis = React.useMemo(() => analyseInventory(rows), [rows]);
  const [loadingDemo, setLoadingDemo] = React.useState(false);

  function handleFileChange(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result: any) => {
        const parsed = parseInventoryCsvRows(result.data);
        onRowsLoaded(parsed.rows, parsed.warnings);
      },
      error: (err: any) => alert('Ошибка при чтении CSV склада: ' + err.message),
    });
  }

  async function handleLoadDemo() {
    try {
      setLoadingDemo(true);
      const response = await fetch('./data/inventory.csv');
      const text = await response.text();
      const result = Papa.parse(text, { header: true, skipEmptyLines: true });
      const parsed = parseInventoryCsvRows(result.data);
      onRowsLoaded(parsed.rows, parsed.warnings);
    } catch (err: any) {
      console.error(err);
      alert('Не удалось загрузить демо-данные склада');
    } finally {
      setLoadingDemo(false);
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="box">
          <h2 className="title is-5">Загрузка данных склада</h2>
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
                {rows.length ? `Позиций: ${rows.length}` : 'Файл не выбран'}
              </span>
            </label>
          </div>
          <p className="help">
            Ожидаемые колонки: tool_name, stock, min_threshold, location, updated_at,
            avg_daily_outflow
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

        <div className="columns">
          <div className="column is-5">
            <div className="box">
              <h3 className="title is-6">Низкий остаток</h3>
              {!analysis.lowStock.length && (
                <p className="has-text-grey">Нет позиций с критически низким остатком</p>
              )}
              {analysis.lowStock.length > 0 && (
                <ul>
                  {analysis.lowStock.map(item => {
                    const days =
                      item.avg_daily_outflow && item.avg_daily_outflow > 0
                        ? (item.stock / item.avg_daily_outflow).toFixed(1)
                        : null;
                    return (
                      <li key={item.tool_name} className="mb-2">
                        <strong>{item.tool_name}</strong>
                        <br />
                        Остаток: {item.stock} (минимум {item.min_threshold})
                        {days ? ` · ~${days} дн. до нулевого остатка` : ''}
                        {item.location ? ` · ${item.location}` : ''}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
          <div className="column">
            <div className="table-container box">
              <table className="table is-fullwidth is-striped is-hoverable">
                <thead>
                  <tr>
                    <th>Инструмент</th>
                    <th className="has-text-right">Остаток</th>
                    <th className="has-text-right">Минимум</th>
                    <th>Локация</th>
                    <th>Обновлено</th>
                    <th className="has-text-right">Ср. расход/день</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(item => {
                    const isLow = item.stock <= item.min_threshold;
                    return (
                      <tr key={`${item.tool_name}-${item.location || ''}`} className={isLow ? 'has-background-warning-light' : ''}>
                        <td>{item.tool_name}</td>
                        <td className="has-text-right">{item.stock}</td>
                        <td className="has-text-right">{item.min_threshold}</td>
                        <td>{item.location || '—'}</td>
                        <td>{item.updated_at || '—'}</td>
                        <td className="has-text-right">
                          {item.avg_daily_outflow !== undefined ? item.avg_daily_outflow : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {!rows.length && (
                    <tr>
                      <td colSpan={6} className="has-text-centered has-text-grey">
                        Нет загруженных данных склада
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
