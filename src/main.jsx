import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { AppShell } from './components/AppShell.jsx';
import { LoginPage, ChangePasswordPage } from './pages/Login.jsx';
import { SetupPage } from './pages/Setup.jsx';
import { ForecastPage } from './pages/Forecast.jsx';
import { CateringPage } from './pages/Catering.jsx';
import { BreakfastPage } from './pages/Breakfast.jsx';
import { LunchPage } from './pages/Lunch.jsx';
import { PCRPage } from './pages/PCR.jsx';
import { SectionsPage } from './pages/Sections.jsx';
import {
  FOHPage, InHousePrepPage, OrderSheetsPage, PARPage, EndOfDayPage, ReportsPage
} from './pages/OtherPages.jsx';
import {
  AdminProductsPage, AdminBatchesPage, AdminShopsPage,
  AdminUsersPage, AdminSuppliersPage, AdminMappingsPage
} from './pages/admin/AdminPages.jsx';
import './styles.css';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--forest)',color:'var(--peach)',fontSize:16,fontFamily:'Work Sans,sans-serif'}}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace/>;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace/>;
  if (adminOnly && !isAdmin) return <Navigate to="/breakfast" replace/>;
  return children;
}

function App() {
  return (
    <BrowserRouter basename="/farmerj-planner">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/change-password" element={<ChangePasswordPage/>}/>
          <Route path="/" element={<ProtectedRoute><AppShell/></ProtectedRoute>}>
            <Route index element={<Navigate to="/breakfast" replace/>}/>
            <Route path="setup" element={<SetupPage/>}/>
            <Route path="forecast" element={<ForecastPage/>}/>
            <Route path="catering" element={<CateringPage/>}/>
            <Route path="breakfast" element={<BreakfastPage/>}/>
            <Route path="lunch" element={<LunchPage/>}/>
            <Route path="pcr" element={<PCRPage/>}/>
            <Route path="sections" element={<SectionsPage/>}/>
            <Route path="foh" element={<FOHPage/>}/>
            <Route path="inhouse" element={<InHousePrepPage/>}/>
            <Route path="orders" element={<OrderSheetsPage/>}/>
            <Route path="par" element={<PARPage/>}/>
            <Route path="eod" element={<EndOfDayPage/>}/>
            <Route path="reports" element={<ReportsPage/>}/>
            <Route path="admin/products" element={<ProtectedRoute adminOnly><AdminProductsPage/></ProtectedRoute>}/>
            <Route path="admin/batches" element={<ProtectedRoute adminOnly><AdminBatchesPage/></ProtectedRoute>}/>
            <Route path="admin/shops" element={<ProtectedRoute adminOnly><AdminShopsPage/></ProtectedRoute>}/>
            <Route path="admin/users" element={<ProtectedRoute adminOnly><AdminUsersPage/></ProtectedRoute>}/>
            <Route path="admin/suppliers" element={<ProtectedRoute adminOnly><AdminSuppliersPage/></ProtectedRoute>}/>
            <Route path="admin/mappings" element={<ProtectedRoute adminOnly><AdminMappingsPage/></ProtectedRoute>}/>
          </Route>
          <Route path="*" element={<Navigate to="/breakfast" replace/>}/>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
