import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function mount() {
  const root = document.getElementById('root');
  if (!root) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount);
    } else {
      setTimeout(mount, 50);
    }
    return;
  }
  createRoot(root).render(<App />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}