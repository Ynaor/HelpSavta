import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import Home from './pages/Home';
import RequestHelp from './pages/RequestHelp';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import CalendarView from './pages/admin/CalendarView';
import ManageRequests from './pages/admin/ManageRequests';
import ManageSlots from './pages/admin/ManageSlots';
import ManageNotifications from './pages/admin/ManageNotifications';
import ManageAdmins from './pages/admin/ManageAdmins';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes with main layout */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/request-help" element={<Layout><RequestHelp /></Layout>} />
        
        {/* Admin login route (no layout) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Admin routes with admin layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="requests" element={<ManageRequests />} />
          <Route path="slots" element={<ManageSlots />} />
          <Route path="notifications" element={<ManageNotifications />} />
          <Route path="admins" element={<ManageAdmins />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;