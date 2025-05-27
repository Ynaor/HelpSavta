import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import RequestHelp from './pages/RequestHelp';
import AdminLogin from './pages/admin/AdminLogin';
import ManageRequests from './pages/admin/ManageRequests';
import ManageSlots from './pages/admin/ManageSlots';
import './index.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/request-help" element={<RequestHelp />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/requests" element={<ManageRequests />} />
          <Route path="/admin/slots" element={<ManageSlots />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;