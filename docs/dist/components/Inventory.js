import { parseInventoryCsvRows, analyseInventory, } from '../utils';
export function Inventory({ rows, warnings, onRowsLoaded }) {
    const analysis = React.useMemo(() => analyseInventory(rows), [rows]);
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
                const parsed = parseInventoryCsvRows(result.data);
                onRowsLoaded(parsed.rows, parsed.warnings);
            },
            error: (err) => alert('Ошибка при чтении CSV склада: ' + err.message),
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
        }
        catch (err) {
            console.error(err);
            alert('Не удалось загрузить демо-данные склада');
        }
        finally {
            setLoadingDemo(false);
        }
    }
    return (React.createElement("section", { className: "section" },
        React.createElement("div", { className: "container" },
            React.createElement("div", { className: "box" },
                React.createElement("h2", { className: "title is-5" }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445 \u0441\u043A\u043B\u0430\u0434\u0430"),
                React.createElement("div", { className: "file has-name is-fullwidth" },
                    React.createElement("label", { className: "file-label" },
                        React.createElement("input", { className: "file-input", type: "file", accept: ".csv,text/csv", onChange: handleFileChange }),
                        React.createElement("span", { className: "file-cta" },
                            React.createElement("span", { className: "file-icon" },
                                React.createElement("i", { className: "fas fa-upload" })),
                            React.createElement("span", { className: "file-label" }, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 CSV\u2026")),
                        React.createElement("span", { className: "file-name" }, rows.length ? `Позиций: ${rows.length}` : 'Файл не выбран'))),
                React.createElement("p", { className: "help" }, "\u041E\u0436\u0438\u0434\u0430\u0435\u043C\u044B\u0435 \u043A\u043E\u043B\u043E\u043D\u043A\u0438: tool_name, stock, min_threshold, location, updated_at, avg_daily_outflow"),
                React.createElement("div", { className: "buttons mt-3" },
                    React.createElement("button", { className: `button is-link ${loadingDemo ? 'is-loading' : ''}`, onClick: handleLoadDemo, type: "button" }, "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0434\u0435\u043C\u043E-\u0434\u0430\u043D\u043D\u044B\u0435")),
                warnings.length > 0 && (React.createElement("article", { className: "message is-warning mt-3" },
                    React.createElement("div", { className: "message-header" },
                        React.createElement("p", null, "\u041F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u044F")),
                    React.createElement("div", { className: "message-body" },
                        React.createElement("ul", null, warnings.map((warn, idx) => (React.createElement("li", { key: idx }, warn)))))))),
            React.createElement("div", { className: "columns" },
                React.createElement("div", { className: "column is-5" },
                    React.createElement("div", { className: "box" },
                        React.createElement("h3", { className: "title is-6" }, "\u041D\u0438\u0437\u043A\u0438\u0439 \u043E\u0441\u0442\u0430\u0442\u043E\u043A"),
                        !analysis.lowStock.length && (React.createElement("p", { className: "has-text-grey" }, "\u041D\u0435\u0442 \u043F\u043E\u0437\u0438\u0446\u0438\u0439 \u0441 \u043A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043D\u0438\u0437\u043A\u0438\u043C \u043E\u0441\u0442\u0430\u0442\u043A\u043E\u043C")),
                        analysis.lowStock.length > 0 && (React.createElement("ul", null, analysis.lowStock.map(item => {
                            const days = item.avg_daily_outflow && item.avg_daily_outflow > 0
                                ? (item.stock / item.avg_daily_outflow).toFixed(1)
                                : null;
                            return (React.createElement("li", { key: item.tool_name, className: "mb-2" },
                                React.createElement("strong", null, item.tool_name),
                                React.createElement("br", null),
                                "\u041E\u0441\u0442\u0430\u0442\u043E\u043A: ",
                                item.stock,
                                " (\u043C\u0438\u043D\u0438\u043C\u0443\u043C ",
                                item.min_threshold,
                                ")",
                                days ? ` · ~${days} дн. до нулевого остатка` : '',
                                item.location ? ` · ${item.location}` : ''));
                        }))))),
                React.createElement("div", { className: "column" },
                    React.createElement("div", { className: "table-container box" },
                        React.createElement("table", { className: "table is-fullwidth is-striped is-hoverable" },
                            React.createElement("thead", null,
                                React.createElement("tr", null,
                                    React.createElement("th", null, "\u0418\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442"),
                                    React.createElement("th", { className: "has-text-right" }, "\u041E\u0441\u0442\u0430\u0442\u043E\u043A"),
                                    React.createElement("th", { className: "has-text-right" }, "\u041C\u0438\u043D\u0438\u043C\u0443\u043C"),
                                    React.createElement("th", null, "\u041B\u043E\u043A\u0430\u0446\u0438\u044F"),
                                    React.createElement("th", null, "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E"),
                                    React.createElement("th", { className: "has-text-right" }, "\u0421\u0440. \u0440\u0430\u0441\u0445\u043E\u0434/\u0434\u0435\u043D\u044C"))),
                            React.createElement("tbody", null,
                                rows.map(item => {
                                    const isLow = item.stock <= item.min_threshold;
                                    return (React.createElement("tr", { key: `${item.tool_name}-${item.location || ''}`, className: isLow ? 'has-background-warning-light' : '' },
                                        React.createElement("td", null, item.tool_name),
                                        React.createElement("td", { className: "has-text-right" }, item.stock),
                                        React.createElement("td", { className: "has-text-right" }, item.min_threshold),
                                        React.createElement("td", null, item.location || '—'),
                                        React.createElement("td", null, item.updated_at || '—'),
                                        React.createElement("td", { className: "has-text-right" }, item.avg_daily_outflow !== undefined ? item.avg_daily_outflow : '—')));
                                }),
                                !rows.length && (React.createElement("tr", null,
                                    React.createElement("td", { colSpan: 6, className: "has-text-centered has-text-grey" }, "\u041D\u0435\u0442 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u0441\u043A\u043B\u0430\u0434\u0430")))))))))));
}
