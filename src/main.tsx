import { createRoot } from 'react-dom/client';
import App from '@/App';
import '@/styles/global.css';

/**
 * Nota: sin <StrictMode>. React Three Fiber v8 tiene problemas conocidos con el
 * doble montaje de StrictMode (el <Canvas> no se re-mide y queda 300x150).
 * Cuando migremos a R3F v9 / React 19 se puede volver a activar.
 */
const container = document.getElementById('root');
if (!container) throw new Error('No se encontró #root');

createRoot(container).render(<App />);
