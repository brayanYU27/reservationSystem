
import { StrictMode } from 'react';
import { createRoot } from "react-dom/client";
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from "./app/App.tsx";
import { AuthProvider } from './contexts/AuthContext';
import { BusinessProvider } from './contexts/BusinessContext';
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BusinessProvider>
          <App />
          <Toaster position="top-right" richColors />
        </BusinessProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
