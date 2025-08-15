import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/suppressRechartsWarnings'

createRoot(document.getElementById("root")!).render(<App />);
