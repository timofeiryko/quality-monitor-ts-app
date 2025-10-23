import {
  Thresholds,
  DEFAULT_THRESHOLDS,
} from '../utils.js';

interface SettingsProps {
  thresholds: Thresholds;
  onThresholdsChange(next: Thresholds): void;
}

export function Settings({ thresholds, onThresholdsChange }: SettingsProps) {
  const [draft, setDraft] = React.useState<Thresholds>({ ...thresholds });
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDraft({ ...thresholds });
  }, [thresholds]);

  function applyChange(key: keyof Thresholds, value: number) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: any) {
    e.preventDefault();
    onThresholdsChange(draft);
    setMessage('Настройки сохранены');
    setTimeout(() => setMessage(null), 2000);
  }

  function handleReset() {
    onThresholdsChange({ ...DEFAULT_THRESHOLDS });
    setMessage('Сброшено к значениям по умолчанию');
    setTimeout(() => setMessage(null), 2000);
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '520px' }}>
        <div className="box">
          <h2 className="title is-4">Настройки порогов</h2>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">Температура критическая, °C</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  value={draft.T_crit}
                  onChange={e => applyChange('T_crit', Number(e.target.value))}
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Вибрация критическая, м/с²</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={draft.V_crit}
                  onChange={e => applyChange('V_crit', Number(e.target.value))}
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Износ критический, %</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  step="1"
                  value={draft.W_crit}
                  onChange={e => applyChange('W_crit', Number(e.target.value))}
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Риск брака критический (p)</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={draft.p_crit}
                  onChange={e => applyChange('p_crit', Number(e.target.value))}
                  min="0"
                  max="1"
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Окно усреднения риска (точек)</label>
              <div className="control">
                <input
                  className="input"
                  type="number"
                  step="1"
                  value={draft.window ?? 50}
                  onChange={e => applyChange('window', Number(e.target.value))}
                  min="1"
                />
              </div>
              <p className="help">
                Используется при расчёте скользящего среднего (в демо — для подсказок).
              </p>
            </div>
            <div className="field is-grouped">
              <div className="control">
                <button className="button is-primary" type="submit">
                  Сохранить
                </button>
              </div>
              <div className="control">
                <button className="button is-light" type="button" onClick={handleReset}>
                  Сбросить
                </button>
              </div>
            </div>
            {message && <p className="has-text-success">{message}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
