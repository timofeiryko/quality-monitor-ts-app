interface LoginProps {
  onSuccess(role: 'admin'): void;
}

interface LoginFormState {
  username: string;
  password: string;
}

const DEMO_USERNAME = 'admin';
const DEMO_PASSWORD = '1234';

export function Login({ onSuccess }: LoginProps) {
  const [form, setForm] = React.useState<LoginFormState>({ username: '', password: '' });
  const [error, setError] = React.useState<string | null>(null);

  function handleChange(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: any) {
    e.preventDefault();
    if (form.username === DEMO_USERNAME && form.password === DEMO_PASSWORD) {
      sessionStorage.setItem('authRole', 'admin');
      setError(null);
      onSuccess('admin');
    } else {
      setError('Неверное имя пользователя или пароль');
    }
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '420px' }}>
        <div className="box">
          <h1 className="title is-4 has-text-centered">Вход в систему мониторинга</h1>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">Имя пользователя</label>
              <div className="control has-icons-left">
                <input
                  className="input"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="admin"
                  autoComplete="username"
                />
                <span className="icon is-small is-left">
                  <i className="fas fa-user" />
                </span>
              </div>
            </div>
            <div className="field">
              <label className="label">Пароль</label>
              <div className="control has-icons-left">
                <input
                  className="input"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="1234"
                  autoComplete="current-password"
                />
                <span className="icon is-small is-left">
                  <i className="fas fa-lock" />
                </span>
              </div>
            </div>
            {error && <p className="has-text-danger">{error}</p>}
            <div className="field">
              <button className="button is-primary is-fullwidth" type="submit">
                Войти
              </button>
            </div>
          </form>
          <p className="has-text-grey is-size-7 has-text-centered">
            Демо-доступ: <strong>admin / 1234</strong>
          </p>
        </div>
      </div>
    </section>
  );
}
