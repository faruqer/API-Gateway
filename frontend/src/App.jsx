import { AppProvider } from './context/AppContext';
import ParticleBackground from './components/ParticleBackground';
import Hero from './components/Hero';
import AuthPanel from './components/AuthPanel';
import ApiExplorer from './components/ApiExplorer';
import RequestLog from './components/RequestLog';
import ArchitectureDiagram from './components/ArchitectureDiagram';

export default function App() {
  return (
    <AppProvider>
      <ParticleBackground />
      <main className="app">
        <Hero />
        <div className="content-grid">
          <AuthPanel />
          <ApiExplorer />
          <RequestLog />
          <ArchitectureDiagram />
        </div>
        <footer className="footer">
          <span>API Gateway Demo</span>
          <span className="footer-sep">·</span>
          <span>Gateway → localhost:3000</span>
          <span className="footer-sep">·</span>
          <span>Frontend → localhost:5173</span>
        </footer>
      </main>
    </AppProvider>
  );
}
