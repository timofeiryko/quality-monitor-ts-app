import { App } from './App';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (!root) {
    console.error('Не найден контейнер #root');
    return;
  }
  if (typeof ReactDOM.createRoot === 'function') {
    const rootInstance = ReactDOM.createRoot(root);
    rootInstance.render(<App />);
  } else {
    ReactDOM.render(<App />, root);
  }
});
