import {
  ProcessRow,
  ProcessAnalytics,
  EmployeeRow,
  InventoryRow,
  Thresholds,
  Alert,
  evaluateProcessRows,
  loadStoredThresholds,
  persistThresholds,
  analyseInventory,
} from './utils.js';
import { Login } from './components/Login.js';
import { Dashboard } from './components/Dashboard.js';
import { Employees } from './components/Employees.js';
import { Inventory } from './components/Inventory.js';
import { Settings } from './components/Settings.js';

type TabKey = 'dashboard' | 'employees' | 'inventory' | 'settings';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'dashboard', label: 'Дашборд' },
  { key: 'employees', label: 'Работники' },
  { key: 'inventory', label: 'Склад' },
  { key: 'settings', label: 'Настройки' },
];

export function App() {
  const [role, setRole] = React.useState<string | null>(() => {
    return sessionStorage.getItem('authRole');
  });
  const [activeTab, setActiveTab] = React.useState<TabKey>('dashboard');
  const [menuOpen, setMenuOpen] = React.useState(false);

  const [thresholds, setThresholds] = React.useState<Thresholds>(() => loadStoredThresholds());

  const [processRows, setProcessRows] = React.useState<ProcessRow[]>([]);
  const [processWarnings, setProcessWarnings] = React.useState<string[]>([]);
  const [processAnalytics, setProcessAnalytics] = React.useState<ProcessAnalytics>({
    rows: [],
    alerts: [],
    avgP: 0,
  });

  const [employeeRows, setEmployeeRows] = React.useState<EmployeeRow[]>([]);
  const [employeeWarnings, setEmployeeWarnings] = React.useState<string[]>([]);

  const [inventoryRows, setInventoryRows] = React.useState<InventoryRow[]>([]);
  const [inventoryWarnings, setInventoryWarnings] = React.useState<string[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = React.useState<Alert[]>([]);

  React.useEffect(() => {
    const analytics = evaluateProcessRows(processRows, thresholds);
    setProcessAnalytics(analytics);
  }, [processRows, thresholds]);

  React.useEffect(() => {
    const analysis = analyseInventory(inventoryRows);
    setInventoryAlerts(analysis.alerts);
  }, [inventoryRows]);

  function handleLoginSuccess(authRole: 'admin') {
    setRole(authRole);
  }

  function handleLogout() {
    sessionStorage.removeItem('authRole');
    setRole(null);
    setActiveTab('dashboard');
    setProcessRows([]);
    setEmployeeRows([]);
    setInventoryRows([]);
    setMenuOpen(false);
  }

  function handleProcessLoaded(rows: ProcessRow[], warnings: string[]) {
    setProcessRows(rows);
    setProcessWarnings(warnings);
  }

  function handleEmployeesLoaded(rows: EmployeeRow[], warnings: string[]) {
    setEmployeeRows(rows);
    setEmployeeWarnings(warnings);
  }

  function handleInventoryLoaded(rows: InventoryRow[], warnings: string[]) {
    setInventoryRows(rows);
    setInventoryWarnings(warnings);
  }

  function handleThresholdsChange(next: Thresholds) {
    setThresholds(next);
    persistThresholds(next);
    setMenuOpen(false);
  }

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    setMenuOpen(false);
  }

  const combinedAlerts = React.useMemo<Alert[]>(() => {
    const processLatest = processAnalytics.alerts.slice(-5);
    const inventoryLatest = inventoryAlerts.slice(-5);
    return [...processLatest, ...inventoryLatest];
  }, [processAnalytics.alerts, inventoryAlerts]);

  if (!role) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-shell">
      <nav className="navbar is-dark" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <span className="navbar-item">
            <strong>Интеллектуальный мониторинг качества</strong>
          </span>
          <span
            className={`navbar-burger ${menuOpen ? 'is-active' : ''}`}
            aria-label="menu"
            aria-expanded={menuOpen}
            data-target="navMenu"
            onClick={() => setMenuOpen(open => !open)}
          >
            <span />
            <span />
            <span />
          </span>
        </div>
        <div className={`navbar-menu ${menuOpen ? 'is-active' : ''}`} id="navMenu">
          <div className="navbar-start">
            {TABS.map(tab => (
              <a
                key={tab.key}
                className={`navbar-item ${tab.key === activeTab ? 'is-active' : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                {tab.label}
              </a>
            ))}
          </div>
          <div className="navbar-end">
            <div className="navbar-item">
              <div className="buttons">
                <button className="button is-light" onClick={handleLogout}>
                  Выход
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="app-content">
        {activeTab === 'dashboard' && (
          <Dashboard
            analytics={processAnalytics}
            thresholds={thresholds}
            warnings={processWarnings}
            onRowsLoaded={handleProcessLoaded}
            alerts={combinedAlerts}
          />
        )}
        {activeTab === 'employees' && (
          <Employees
            rows={employeeRows}
            warnings={employeeWarnings}
            onRowsLoaded={handleEmployeesLoaded}
          />
        )}
        {activeTab === 'inventory' && (
          <Inventory
            rows={inventoryRows}
            warnings={inventoryWarnings}
            onRowsLoaded={handleInventoryLoaded}
          />
        )}
        {activeTab === 'settings' && (
          <Settings thresholds={thresholds} onThresholdsChange={handleThresholdsChange} />
        )}
      </main>
    </div>
  );
}
