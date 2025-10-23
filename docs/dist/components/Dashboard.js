import { parseProcessCsvRows, buildProcessCsvExport, triggerCsvDownload, } from '../utils';
function makeChartConfig(rows) {
    const labels = rows.map(row => { var _a; return (_a = row.ts) !== null && _a !== void 0 ? _a : String(row.index + 1); });
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
function useChart(rows) {
    const canvasRef = React.useRef(null);
    const chartRef = React.useRef(null);
    React.useEffect(() => {
        if (!canvasRef.current)
            return;
        if (!rows.length) {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
            return;
        }
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx)
            return;
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
    }, [rows]);
    return canvasRef;
}
export function Dashboard({ analytics, thresholds, warnings, onRowsLoaded }) {
    const { rows, alerts, latest, avgP } = analytics;
    const canvasRef = useChart(rows);
    const [loadingDemo, setLoadingDemo] = React.useState(false);
    function handleFileChange(e) {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                const parsed = parseProcessCsvRows(result.data);
                onRowsLoaded(parsed.rows, parsed.warnings);
            },
            error: (err) => {
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
        }
        catch (err) {
            console.error(err);
            alert('Не удалось загрузить демо-данные');
        }
        finally {
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
    return (React.createElement("section", { className: "section" },
        React.createElement("div", { className: "container" },
            React.createElement("div", { className: "columns is-variable is-6" },
                React.createElement("div", { className: "column is-6" },
                    React.createElement("div", { className: "box" },
                        React.createElement("h2", { className: "title is-5" }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u0439 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430"),
                        React.createElement("div", { className: "file has-name is-fullwidth" },
                            React.createElement("label", { className: "file-label" },
                                React.createElement("input", { className: "file-input", type: "file", accept: ".csv,text/csv", onChange: handleFileChange }),
                                React.createElement("span", { className: "file-cta" },
                                    React.createElement("span", { className: "file-icon" },
                                        React.createElement("i", { className: "fas fa-upload" })),
                                    React.createElement("span", { className: "file-label" }, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 CSV\u2026")),
                                React.createElement("span", { className: "file-name" }, rows.length ? `Записей: ${rows.length}` : 'Файл не выбран'))),
                        React.createElement("p", { className: "help" }, "\u041E\u0436\u0438\u0434\u0430\u0435\u043C\u044B\u0435 \u043A\u043E\u043B\u043E\u043D\u043A\u0438: temperature/\u0442\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0430, vibration/\u0432\u0438\u0431\u0440\u0430\u0446\u0438\u044F, wear/\u0438\u0437\u043D\u043E\u0441, defect/\u0431\u0440\u0430\u043A, machine/\u0441\u0442\u0430\u043D\u043E\u043A (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E), time/timestamp (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)"),
                        React.createElement("div", { className: "buttons mt-3" },
                            React.createElement("button", { className: `button is-link ${loadingDemo ? 'is-loading' : ''}`, onClick: handleLoadDemo, type: "button" }, "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0434\u0435\u043C\u043E-\u0434\u0430\u043D\u043D\u044B\u0435"),
                            React.createElement("button", { className: "button is-light", type: "button", onClick: handleExport }, "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u043E\u0442\u0447\u0451\u0442\u0430 CSV")),
                        warnings.length > 0 && (React.createElement("article", { className: "message is-warning mt-3" },
                            React.createElement("div", { className: "message-header" },
                                React.createElement("p", null, "\u041F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u044F \u043F\u0440\u0438 \u043F\u0430\u0440\u0441\u0438\u043D\u0433\u0435")),
                            React.createElement("div", { className: "message-body" },
                                React.createElement("ul", null, warnings.map((warn, idx) => (React.createElement("li", { key: idx }, warn))))))))),
                React.createElement("div", { className: "column is-6" },
                    React.createElement("div", { className: "box" },
                        React.createElement("h2", { className: "title is-5" }, "\u041F\u043E\u0440\u043E\u0433\u043E\u0432\u044B\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F"),
                        React.createElement("div", { className: "content is-small" },
                            React.createElement("p", null,
                                React.createElement("strong", null, "T \u043A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0435:"),
                                " ",
                                thresholds.T_crit,
                                " \u00B0C",
                                React.createElement("br", null),
                                React.createElement("strong", null, "V \u043A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0435:"),
                                " ",
                                thresholds.V_crit,
                                " \u043C/\u0441\u00B2",
                                React.createElement("br", null),
                                React.createElement("strong", null, "W \u043A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0435:"),
                                " ",
                                thresholds.W_crit,
                                " %",
                                React.createElement("br", null),
                                React.createElement("strong", null, "p \u043A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0435:"),
                                " ",
                                thresholds.p_crit),
                            React.createElement("p", null, "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043C\u043E\u0436\u043D\u043E \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0432\u043E \u0432\u043A\u043B\u0430\u0434\u043A\u0435 \u00AB\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438\u00BB."))))),
            React.createElement("div", { className: "columns" },
                React.createElement("div", { className: "column" },
                    React.createElement("div", { className: "box has-text-centered" },
                        React.createElement("p", { className: "heading" }, "\u0422\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0430"),
                        React.createElement("p", { className: "title is-4" }, latest ? `${latest.t.toFixed(2)} °C` : '—'))),
                React.createElement("div", { className: "column" },
                    React.createElement("div", { className: "box has-text-centered" },
                        React.createElement("p", { className: "heading" }, "\u0412\u0438\u0431\u0440\u0430\u0446\u0438\u044F"),
                        React.createElement("p", { className: "title is-4" }, latest ? `${latest.v.toFixed(3)} м/с²` : '—'))),
                React.createElement("div", { className: "column" },
                    React.createElement("div", { className: "box has-text-centered" },
                        React.createElement("p", { className: "heading" }, "\u0418\u0437\u043D\u043E\u0441"),
                        React.createElement("p", { className: "title is-4" }, latest ? `${latest.w.toFixed(1)} %` : '—'))),
                React.createElement("div", { className: "column" },
                    React.createElement("div", { className: "box has-text-centered" },
                        React.createElement("p", { className: "heading" }, "\u0420\u0438\u0441\u043A \u0431\u0440\u0430\u043A\u0430 (\u0441\u0440\u0435\u0434\u043D\u0438\u0439)"),
                        React.createElement("p", { className: "title is-4" }, rows.length ? `${(avgP * 100).toFixed(1)} %` : '—')))),
            React.createElement("div", { className: "box", style: { height: '360px' } }, rows.length ? (React.createElement("canvas", { ref: canvasRef })) : (React.createElement("p", { className: "has-text-grey" }, "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 CSV, \u0447\u0442\u043E\u0431\u044B \u0443\u0432\u0438\u0434\u0435\u0442\u044C \u0433\u0440\u0430\u0444\u0438\u043A\u0438"))),
            React.createElement("div", { className: "box" },
                React.createElement("h3", { className: "title is-6" }, "\u042D\u043A\u0441\u0442\u0440\u0435\u043D\u043D\u044B\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F"),
                !alerts.length && (React.createElement("p", { className: "has-text-grey" }, "\u041A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u043D\u0435 \u043E\u0431\u043D\u0430\u0440\u0443\u0436\u0435\u043D\u044B")),
                alerts.length > 0 && (React.createElement("ul", null, alerts.slice(-8).reverse().map(alert => (React.createElement("li", { key: alert.index }, alert.message)))))))));
}
