import { parseEmployeesCsvRows, buildEmployeeAnalytics, topEmployeesByParts, topEmployeesByDefectRate, buildDailySeries, } from '../utils.js';
function useEmployeeChart(data) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);
    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        if (!data.length) {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
            return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
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
        }
        else {
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
export function Employees({ rows, warnings, onRowsLoaded }) {
    const analytics = React.useMemo(() => buildEmployeeAnalytics(rows), [rows]);
    const [shiftFilter, setShiftFilter] = React.useState('all');
    const [employeeFilter, setEmployeeFilter] = React.useState('all');
    const [loadingDemo, setLoadingDemo] = React.useState(false);
    const shifts = React.useMemo(() => {
        const set = new Set();
        rows.forEach(row => {
            if (row.shift)
                set.add(row.shift);
        });
        return Array.from(set).sort();
    }, [rows]);
    const employees = React.useMemo(() => {
        const map = new Map();
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
            if (shiftFilter !== 'all' && row.shift !== shiftFilter)
                return false;
            if (employeeFilter !== 'all' && row.id !== employeeFilter)
                return false;
            return true;
        });
    }, [rows, shiftFilter, employeeFilter]);
    const filteredAnalytics = React.useMemo(() => buildEmployeeAnalytics(filteredRows), [filteredRows]);
    const chartData = React.useMemo(() => buildDailySeries(filteredAnalytics, shiftFilter, employeeFilter), [filteredAnalytics, shiftFilter, employeeFilter]);
    const canvasRef = useEmployeeChart(chartData);
    function handleFileChange(e) {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                const parsed = parseEmployeesCsvRows(result.data);
                setShiftFilter('all');
                setEmployeeFilter('all');
                onRowsLoaded(parsed.rows, parsed.warnings);
            },
            error: (err) => alert('Ошибка при чтении CSV работников: ' + err.message),
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
        }
        catch (err) {
            console.error(err);
            alert('Не удалось загрузить демо-файл работников');
        }
        finally {
            setLoadingDemo(false);
        }
    }
    return (React.createElement("section", { className: "section" },
        React.createElement("div", { className: "container" },
            React.createElement("div", { className: "box" },
                React.createElement("h2", { className: "title is-5" }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445 \u043F\u043E \u0440\u0430\u0431\u043E\u0442\u043D\u0438\u043A\u0430\u043C"),
                React.createElement("div", { className: "file has-name is-fullwidth" },
                    React.createElement("label", { className: "file-label" },
                        React.createElement("input", { className: "file-input", type: "file", accept: ".csv,text/csv", onChange: handleFileChange }),
                        React.createElement("span", { className: "file-cta" },
                            React.createElement("span", { className: "file-icon" },
                                React.createElement("i", { className: "fas fa-upload" })),
                            React.createElement("span", { className: "file-label" }, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 CSV\u2026")),
                        React.createElement("span", { className: "file-name" }, rows.length ? `Записей: ${rows.length}` : 'Файл не выбран'))),
                React.createElement("p", { className: "help" }, "\u041E\u0436\u0438\u0434\u0430\u0435\u043C\u044B\u0435 \u043A\u043E\u043B\u043E\u043D\u043A\u0438: id, name, shift, parts_made, defects, avg_temp, avg_vib, avg_wear, date"),
                React.createElement("div", { className: "buttons mt-3" },
                    React.createElement("button", { className: `button is-link ${loadingDemo ? 'is-loading' : ''}`, onClick: handleLoadDemo, type: "button" }, "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0434\u0435\u043C\u043E-\u0434\u0430\u043D\u043D\u044B\u0435")),
                warnings.length > 0 && (React.createElement("article", { className: "message is-warning mt-3" },
                    React.createElement("div", { className: "message-header" },
                        React.createElement("p", null, "\u041F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u044F")),
                    React.createElement("div", { className: "message-body" },
                        React.createElement("ul", null, warnings.map((warn, idx) => (React.createElement("li", { key: idx }, warn)))))))),
            React.createElement("div", { className: "columns is-multiline" },
                React.createElement("div", { className: "column is-one-quarter-desktop is-half-tablet" },
                    React.createElement("div", { className: "box has-text-centered" },
                        React.createElement("p", { className: "heading" }, "\u0412\u0441\u0435\u0433\u043E \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u043E\u0432"),
                        React.createElement("p", { className: "title is-4" }, analytics.totalEmployees || '—'))),
                React.createElement("div", { className: "column is-one-quarter-desktop is-half-tablet" },
                    React.createElement("div", { className: "box has-text-centered" },
                        React.createElement("p", { className: "heading" }, "\u041D\u0430 \u0441\u043C\u0435\u043D\u0435 \u0441\u0435\u0439\u0447\u0430\u0441"),
                        React.createElement("p", { className: "title is-4" }, analytics.currentShiftCount || '—'))),
                React.createElement("div", { className: "column is-one-quarter-desktop is-half-tablet" },
                    React.createElement("div", { className: "box has-text-centered" },
                        React.createElement("p", { className: "heading" }, "\u0412\u0441\u0435\u0433\u043E \u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u043E"),
                        React.createElement("p", { className: "title is-4" }, analytics.totalParts || '—'))),
                React.createElement("div", { className: "column is-one-quarter-desktop is-half-tablet" },
                    React.createElement("div", { className: "box has-text-centered" },
                        React.createElement("p", { className: "heading" }, "\u0414\u0435\u0444\u0435\u043A\u0442\u044B, %"),
                        React.createElement("p", { className: "title is-4" }, analytics.totalParts ? `${analytics.defectRate.toFixed(2)} %` : '—')))),
            React.createElement("div", { className: "box" },
                React.createElement("div", { className: "columns is-variable is-4 is-multiline" },
                    React.createElement("div", { className: "column is-4-desktop is-6-tablet" },
                        React.createElement("label", { className: "label is-small" }, "\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u043E \u0441\u043C\u0435\u043D\u0435"),
                        React.createElement("div", { className: "select is-fullwidth" },
                            React.createElement("select", { value: shiftFilter, onChange: e => setShiftFilter(e.target.value) },
                                React.createElement("option", { value: "all" }, "\u0412\u0441\u0435 \u0441\u043C\u0435\u043D\u044B"),
                                shifts.map(shift => (React.createElement("option", { key: shift, value: shift }, shift)))))),
                    React.createElement("div", { className: "column is-4-desktop is-6-tablet" },
                        React.createElement("label", { className: "label is-small" }, "\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u043E \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0443"),
                        React.createElement("div", { className: "select is-fullwidth" },
                            React.createElement("select", { value: employeeFilter, onChange: e => setEmployeeFilter(e.target.value) },
                                React.createElement("option", { value: "all" }, "\u0412\u0441\u0435 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0438"),
                                employees.map(emp => (React.createElement("option", { key: emp.id, value: emp.id }, emp.name))))))),
                React.createElement("div", { className: "columns" },
                    React.createElement("div", { className: "column" },
                        React.createElement("div", { className: "table-container" },
                            React.createElement("table", { className: "table is-fullwidth is-striped is-hoverable" },
                                React.createElement("thead", null,
                                    React.createElement("tr", null,
                                        React.createElement("th", null, "\u0421\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A"),
                                        React.createElement("th", { className: "has-text-right" }, "\u0421\u0443\u043C\u043C\u0430\u0440\u043D\u0430\u044F \u0432\u044B\u0440\u0430\u0431\u043E\u0442\u043A\u0430"))),
                                React.createElement("tbody", null,
                                    topEmployeesByParts(filteredAnalytics, 5).map(entry => {
                                        var _a, _b;
                                        const name = (_b = (_a = employees.find(emp => emp.id === entry.id)) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : entry.id;
                                        return (React.createElement("tr", { key: entry.id },
                                            React.createElement("td", null, name),
                                            React.createElement("td", { className: "has-text-right" }, entry.total)));
                                    }),
                                    !filteredRows.length && (React.createElement("tr", null,
                                        React.createElement("td", { colSpan: 2, className: "has-text-centered has-text-grey" }, "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0445 \u0444\u0438\u043B\u044C\u0442\u0440\u043E\u0432"))))))),
                    React.createElement("div", { className: "column" },
                        React.createElement("div", { className: "table-container" },
                            React.createElement("table", { className: "table is-fullwidth is-striped is-hoverable" },
                                React.createElement("thead", null,
                                    React.createElement("tr", null,
                                        React.createElement("th", null, "\u0421\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A"),
                                        React.createElement("th", { className: "has-text-right" }, "\u0414\u0435\u0444\u0435\u043A\u0442\u044B, %"))),
                                React.createElement("tbody", null,
                                    topEmployeesByDefectRate(filteredAnalytics, 5).map(entry => {
                                        var _a, _b;
                                        const name = (_b = (_a = employees.find(emp => emp.id === entry.id)) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : entry.id;
                                        return (React.createElement("tr", { key: entry.id },
                                            React.createElement("td", null, name),
                                            React.createElement("td", { className: "has-text-right" }, entry.rate.toFixed(2))));
                                    }),
                                    !filteredRows.length && (React.createElement("tr", null,
                                        React.createElement("td", { colSpan: 2, className: "has-text-centered has-text-grey" }, "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0445 \u0444\u0438\u043B\u044C\u0442\u0440\u043E\u0432")))))))),
                React.createElement("div", { className: "box", style: { height: '320px' } }, chartData.length ? (React.createElement("canvas", { ref: canvasRef })) : (React.createElement("p", { className: "has-text-grey" }, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0444\u0430\u0439\u043B \u0438\u043B\u0438 \u0434\u0435\u043C\u043E-\u0434\u0430\u043D\u043D\u044B\u0435, \u0447\u0442\u043E\u0431\u044B \u0443\u0432\u0438\u0434\u0435\u0442\u044C \u0434\u0438\u043D\u0430\u043C\u0438\u043A\u0443 \u043F\u043E \u0434\u0430\u0442\u0430\u043C")))))));
}
