import { App } from './App';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (!root) {
    console.error('Не найден контейнер #root');
    return;
  }
  ReactDOM.render(<App />, root);
});
