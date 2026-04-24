import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Adhesion from './pages/Adhesion';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './services/ProtectedRoute';
import CommandesPage from './pages/Commandes';
import CommercialDashboard from './pages/DashboardCommercial';
import GestionFournisseurs from './pages/GestionFournisseurs';
import DashboardFournisseur from './pages/DashboardFournisseur';
import Factures from "./pages/Factures";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/adhesion" element={<Adhesion />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/activate" element={<Auth />} />
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
        </ProtectedRoute>
    } />
    <Route path="/dashboard/commercial" element={
    <ProtectedRoute allowedRoles={['COMMERCIAL']}>
        <CommercialDashboard />
    </ProtectedRoute>
} />    <Route path="/commandes" element={<CommandesPage />} />
    <Route path="/dashboard/fournisseur" element={
        <ProtectedRoute allowedRoles={['FOURNISSEUR']}>
            <DashboardFournisseur />
        </ProtectedRoute>
    } />
    <Route path="/gestion-fournisseurs" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <GestionFournisseurs />
        </ProtectedRoute>
    } />
    
    <Route path="/factures" element={<Factures />} />
      </Routes>
    
    </Router>
  );
}

export default App;