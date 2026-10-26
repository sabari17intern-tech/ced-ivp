import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Drawer from './components/layout/Drawer';
import ModalOverlay from './components/modals/ModalOverlay';
import ToastContainer from './components/layout/ToastContainer';
import WhatsAppBtn from './components/common/WhatsAppBtn';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import WorkflowPipeline from './pages/Admin/WorkflowPipeline';
import StartupsList from './pages/Admin/StartupsList';
import ApplicationsList from './pages/Admin/ApplicationsList';
import EvaluationsView from './pages/Admin/EvaluationsView';
import GrantReviewView from './pages/Admin/GrantReviewView';
import GrantsDisbursement from './pages/Admin/GrantsDisbursement';
import AnalyticsView from './pages/Admin/AnalyticsView';
import DocumentsView from './pages/Admin/DocumentsView';
import ReportsView from './pages/Admin/ReportsView';
import SettingsView from './pages/Admin/SettingsView';
import ReviewerView from './pages/Admin/ReviewerView';

// Student Pages
import MyDashboard from './pages/Student/MyDashboard';
import MyDetails from './pages/Student/MyDetails';
import MyTeam from './pages/Student/MyTeam';
import MyDocuments from './pages/Student/MyDocuments';
import MyGrant from './pages/Student/MyGrant';
import MyNotifications from './pages/Student/MyNotifications';
import MyProfile from './pages/Student/MyProfile';

const App = () => {
  const { currentUser, currentPage } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!currentUser || currentPage === 'login') {
    if (currentPage === 'register') {
      return (
        <>
          <Register />
          <ToastContainer />
        </>
      );
    }
    return (
      <>
        <Login />
        <ToastContainer />
      </>
    );
  }

  const renderAdminPage = () => {
    switch (currentPage) {
      case 'workflow': return <WorkflowPipeline />;
      case 'startups': return <StartupsList />;
      case 'applications': return <ApplicationsList />;
      case 'evaluations': return <EvaluationsView />;
      case 'reviewers': return <ReviewerView />;
      case 'edi': return <GrantReviewView />;
      case 'grants': return <GrantsDisbursement />;
      case 'analytics': return <AnalyticsView />;
      case 'documents': return <DocumentsView />;
      case 'reports': return <ReportsView />;
      case 'settings': return <SettingsView />;
      default: return <WorkflowPipeline />;
    }
  };

  const renderStudentPage = () => {
    switch (currentPage) {
      case 'myDashboard': return <MyDashboard />;
      case 'myApplication': return <MyDetails />;
      case 'myTeam': return <MyTeam />;
      case 'myDocuments': return <MyDocuments />;
      case 'myGrant': return <MyGrant />;
      case 'myNotifications': return <MyNotifications />;
      case 'myProfile': return <MyProfile />;
      default: return <MyDashboard />;
    }
  };

  return (
    <div id="appShell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div id="mainWrap">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main id="mainContent">
          {currentUser.role === 'admin' ? renderAdminPage() : renderStudentPage()}
        </main>
      </div>

      <Drawer />
      <ModalOverlay />
      <ToastContainer />
      <WhatsAppBtn />
    </div>
  );
};

export default App;
