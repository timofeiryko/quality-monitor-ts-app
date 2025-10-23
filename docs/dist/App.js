import { evaluateProcessRows, loadStoredThresholds, persistThresholds, analyseInventory, } from './utils.js';
import { Login } from './components/Login.js';
import { Dashboard } from './components/Dashboard.js';
import { Employees } from './components/Employees.js';
import { Inventory } from './components/Inventory.js';
import { Settings } from './components/Settings.js';
const TABS = [
    { key: 'dashboard', label: 'Дашборд' },
    { key: 'employees', label: 'Работники' },
    { key: 'inventory', label: 'Склад' },
    { key: 'settings', label: 'Настройки' },
];
export function App() {
    const [role, setRole] = React.useState(() => {
        return sessionStorage.getItem('authRole');
    });
    const [activeTab, setActiveTab] = React.useState('dashboard');
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [thresholds, setThresholds] = React.useState(() => loadStoredThresholds());
    const [processRows, setProcessRows] = React.useState([]);
    const [processWarnings, setProcessWarnings] = React.useState([]);
    const [processAnalytics, setProcessAnalytics] = React.useState({
        rows: [],
        alerts: [],
        avgP: 0,
    });
    const [employeeRows, setEmployeeRows] = React.useState([]);
    const [employeeWarnings, setEmployeeWarnings] = React.useState([]);
    const [inventoryRows, setInventoryRows] = React.useState([]);
    const [inventoryWarnings, setInventoryWarnings] = React.useState([]);
    const [inventoryAlerts, setInventoryAlerts] = React.useState([]);
    React.useEffect(() => {
        const analytics = evaluateProcessRows(processRows, thresholds);
        setProcessAnalytics(analytics);
    }, [processRows, thresholds]);
    React.useEffect(() => {
        const analysis = analyseInventory(inventoryRows);
        setInventoryAlerts(analysis.alerts);
    }, [inventoryRows]);
    function handleLoginSuccess(authRole) {
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
    function handleProcessLoaded(rows, warnings) {
        setProcessRows(rows);
        setProcessWarnings(warnings);
    }
    function handleEmployeesLoaded(rows, warnings) {
        setEmployeeRows(rows);
        setEmployeeWarnings(warnings);
    }
    function handleInventoryLoaded(rows, warnings) {
        setInventoryRows(rows);
        setInventoryWarnings(warnings);
    }
    function handleThresholdsChange(next) {
        setThresholds(next);
        persistThresholds(next);
        setMenuOpen(false);
    }
    function handleTabChange(tab) {
        setActiveTab(tab);
        setMenuOpen(false);
    }
    const combinedAlerts = React.useMemo(() => {
        const processLatest = processAnalytics.alerts.slice(-5);
        const inventoryLatest = inventoryAlerts.slice(-5);
        return [...processLatest, ...inventoryLatest];
    }, [processAnalytics.alerts, inventoryAlerts]);
    if (!role) {
        return React.createElement(Login, { onSuccess: handleLoginSuccess });
    }
    return (React.createElement("div", null,
        React.createElement("nav", { className: "navbar is-dark", role: "navigation", "aria-label": "main navigation" },
            React.createElement("div", { className: "navbar-brand" },
                React.createElement("span", { className: "navbar-item" },
                    React.createElement("strong", null, "\u0418\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u044B\u0439 \u043C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433 \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0430")),
                React.createElement("span", { className: `navbar-burger ${menuOpen ? 'is-active' : ''}`, "aria-label": "menu", "aria-expanded": menuOpen, "data-target": "navMenu", onClick: () => setMenuOpen(open => !open) },
                    React.createElement("span", null),
                    React.createElement("span", null),
                    React.createElement("span", null))),
            React.createElement("div", { className: `navbar-menu ${menuOpen ? 'is-active' : ''}`, id: "navMenu" },
                React.createElement("div", { className: "navbar-start" }, TABS.map(tab => (React.createElement("a", { key: tab.key, className: `navbar-item ${tab.key === activeTab ? 'is-active' : ''}`, onClick: () => handleTabChange(tab.key) }, tab.label)))),
                React.createElement("div", { className: "navbar-end" },
                    React.createElement("div", { className: "navbar-item" },
                        React.createElement("div", { className: "buttons" },
                            React.createElement("button", { className: "button is-light", onClick: handleLogout }, "\u0412\u044B\u0445\u043E\u0434")))))),
        activeTab === 'dashboard' && (React.createElement(Dashboard, { analytics: processAnalytics, thresholds: thresholds, warnings: processWarnings, onRowsLoaded: handleProcessLoaded, alerts: combinedAlerts })),
        activeTab === 'employees' && (React.createElement(Employees, { rows: employeeRows, warnings: employeeWarnings, onRowsLoaded: handleEmployeesLoaded })),
        activeTab === 'inventory' && (React.createElement(Inventory, { rows: inventoryRows, warnings: inventoryWarnings, onRowsLoaded: handleInventoryLoaded })),
        activeTab === 'settings' && (React.createElement(Settings, { thresholds: thresholds, onThresholdsChange: handleThresholdsChange }))));
}
