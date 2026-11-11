import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { PublicHeader } from './components/layout/PublicHeader';
import { PublicFooter } from './components/layout/PublicFooter';
import { AppSidebar } from './components/layout/AppSidebar';
import { AppTopbar } from './components/layout/AppTopbar';

// Public components
import { HeroSection } from './components/public/HeroSection';
import { CategoriesSection } from './components/public/CategoriesSection';
import { ServicesGrid } from './components/public/ServicesGrid';
import { HowItWorksSection } from './components/public/HowItWorksSection';
import { WhyKwaboSection } from './components/public/WhyKwaboSection';
import { DiasporaRequestsSection } from './components/public/DiasporaRequestsSection';
import { FaqSection } from './components/public/FaqSection';
import { SignupCtaSection } from './components/public/SignupCtaSection';
import { ServiceResultsPage } from './components/public/ServiceResultsPage';
import { ServiceDetailModal } from './components/public/ServiceDetailModal';
import { LegalPage } from './components/public/LegalPage';

// Auth components
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';

// Client components
import { ClientDashboard } from './components/client/ClientDashboard';
import { ClientRequests } from './components/client/ClientRequests';
import { ClientRequestDetail } from './components/client/ClientRequestDetail';
import { ClientNewRequest } from './components/client/ClientNewRequest';
import { ClientDocuments } from './components/client/ClientDocuments';
import { ClientMessages } from './components/client/ClientMessages';
import { ClientInvoices } from './components/client/ClientInvoices';
import { ClientReferral } from './components/client/ClientReferral';
import { ClientProfile } from './components/client/ClientProfile';

// Admin components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminRequests } from './components/admin/AdminRequests';
import { AdminRequestDetail } from './components/admin/AdminRequestDetail';
import { AdminMessages } from './components/admin/AdminMessages';
import { AdminKpis } from './components/admin/AdminKpis';
import { AdminClients } from './components/admin/AdminClients';
import { AdminInvoices } from './components/admin/AdminInvoices';
import { AdminReviews } from './components/admin/AdminReviews';
import { AdminReferrals } from './components/admin/AdminReferrals';
import { AdminCatalog } from './components/admin/AdminCatalog';
import { AdminTeam } from './components/admin/AdminTeam';
import { AdminAudit } from './components/admin/AdminAudit';

// Operator components
import { OperatorDashboard } from './components/operator/OperatorDashboard';
import { OperatorMissions } from './components/operator/OperatorMissions';
import { OperatorMissionDetail } from './components/operator/OperatorMissionDetail';

// Common components
import { PhotoModal } from './components/common/PhotoModal';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmDialog } from './components/common/ConfirmDialog';

const MainAppContent: React.FC = () => {
  const { role, currentView, currentUser, authLoading, navigate } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState('Dossier visa');

  if (authLoading && currentView !== 'reset-password') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9f7f4] gap-3">
        <div
          className="w-10 h-10 rounded-full border-4 border-[#e2ddd5] border-t-[#1d3a2f] animate-spin"
          aria-label="Chargement"
        />
        <p className="text-sm text-[#6b655e]">Chargement de votre espace KWABO…</p>
      </div>
    );
  }

  // Handle category selection from categories section
  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    const servicesEl = document.getElementById('services');
    if (servicesEl) {
      servicesEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectRequest = (request: string) => {
    setSelectedRequest(request);
    navigate('public-services');
  };

  // 1. PUBLIC OR AUTH VIEWS
  if (role === 'VISITOR' || currentView === 'login' || currentView === 'admin-login' || currentView === 'operator-login' || currentView === 'register' || currentView === 'forgot-password' || currentView === 'reset-password' || currentView === 'privacy' || currentView === 'cgu') {
    return (
      <div className="min-h-screen flex flex-col bg-[#f9f7f4]">
        {currentView === 'login' ? (
          <LoginPage mode="client" />
        ) : currentView === 'admin-login' ? (
          <LoginPage mode="admin" />
        ) : currentView === 'operator-login' ? (
          <LoginPage mode="operator" />
        ) : currentView === 'register' ? (
          <RegisterPage />
        ) : currentView === 'forgot-password' || currentView === 'reset-password' ? (
          <ForgotPasswordPage />
        ) : currentView === 'privacy' ? (
          <LegalPage type="confidentialite" />
        ) : currentView === 'cgu' ? (
          <LegalPage type="cgu" />
        ) : (
          <>
            <PublicHeader />
            <main className="flex-1">
              {currentView === 'public-services' ? (
                <ServiceResultsPage
                  request={selectedRequest}
                  onBack={() => navigate('public-home')}
                />
              ) : (
                <>
                  <HeroSection />
                  <CategoriesSection onSelectCategory={handleSelectCategory} />
                  <ServicesGrid 
                    selectedCategory={selectedCategory} 
                    onSelectCategory={setSelectedCategory} 
                  />
                  <HowItWorksSection />
                  <WhyKwaboSection />
                  <DiasporaRequestsSection onSelectRequest={handleSelectRequest} />
                  <FaqSection />
                  <SignupCtaSection />
                </>
              )}
            </main>
            <PublicFooter />
          </>
        )}

        <ServiceDetailModal />
        <PhotoModal />
        <ConfirmDialog />
        <ToastContainer />
      </div>
    );
  }

  // 2. CONNECTED WORKSPACES (Client, Admin, Operator)
  const getTopbarTitle = () => {
    switch (currentView) {
      // Client
      case 'client-dashboard': return { title: 'Tableau de bord', subtitle: `Bienvenue, ${currentUser?.firstName}` };
      case 'client-requests': return { title: 'Mes demandes', subtitle: 'Suivi de vos missions' };
      case 'client-request-detail': return { title: 'Détail de la mission', subtitle: 'Suivi et livrables' };
      case 'client-new-request': return { title: 'Nouvelle demande', subtitle: 'Sélectionnez un service' };
      case 'client-documents': return { title: 'Mes documents', subtitle: 'Vidéos 360°, rapports et reçus' };
      case 'client-messages': return { title: 'Messagerie', subtitle: 'Échanges en direct avec l\'équipe' };
      case 'client-invoices': return { title: 'Factures & Règlements', subtitle: 'Paiements sécurisés' };
      case 'client-referral': return { title: 'Programme de parrainage', subtitle: 'Gagnez 15 € de crédit' };
      case 'client-profile': return { title: 'Mon profil', subtitle: 'Paramètres du compte diaspora' };
      
      // Admin
      case 'admin-dashboard': return { title: 'Vue d\'ensemble', subtitle: 'Supervision générale KWABO' };
      case 'admin-requests': return { title: 'Demandes de service', subtitle: 'Validation et attribution' };
      case 'admin-request-detail': return { title: 'Gestion du dossier', subtitle: 'Devis, agent et documents' };
      case 'admin-messages': return { title: 'Messagerie', subtitle: role === 'OPERATOR' ? 'Discussions avec vos clients' : 'Les discussions avec les clients, par demande' };
      case 'admin-kpis': return { title: 'Indicateurs de performance', subtitle: 'Objectifs M6 & M12 du cahier des charges' };
      case 'admin-clients': return { title: 'Annuaire des clients', subtitle: 'Clients diaspora' };
      case 'admin-invoices': return { title: 'Paiements & Encaissements', subtitle: 'Journal financier' };
      case 'admin-reviews': return { title: 'Modération des avis', subtitle: 'Validation des témoignages' };
      case 'admin-referrals': return { title: 'Parrainage', subtitle: 'Parrains, filleuls et récompenses' };
      case 'admin-catalog': return { title: 'Catalogue & Tarifs', subtitle: 'Gestion des prestations' };
      case 'admin-team': return { title: 'Équipe & Permissions', subtitle: 'Coordination et agents' };
      case 'admin-audit': return { title: 'Journal d\'audit', subtitle: 'Traçabilité des opérations' };
      
      // Operator
      case 'operator-dashboard': return { title: `Bonjour ${currentUser?.firstName || 'Maxime'}`, subtitle: 'Vos missions sur le terrain' };
      case 'operator-missions': return { title: 'Demandes attribuées', subtitle: 'Suivis et interventions' };
      case 'operator-mission-detail': return { title: 'Détail de la mission', subtitle: 'Suivi, documents et livrables' };

      default: return { title: 'KWABO', subtitle: 'Plateforme diaspora' };
    }
  };

  const { title, subtitle } = getTopbarTitle();

  return (
    <div className="app-wrapper">
      <div className="app">
        {/* Sidebar */}
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="app-main">
          <AppTopbar 
            title={title} 
            subtitle={subtitle} 
            onOpenSidebar={() => setSidebarOpen(true)} 
          />

          <main className="app-content" id="main" tabIndex={-1}>
            {/* View router */}
            {/* CLIENT VIEWS */}
            {currentView === 'client-dashboard' && <ClientDashboard />}
            {currentView === 'client-requests' && <ClientRequests />}
            {currentView === 'client-request-detail' && <ClientRequestDetail />}
            {currentView === 'client-new-request' && <ClientNewRequest />}
            {currentView === 'client-documents' && <ClientDocuments />}
            {currentView === 'client-messages' && <ClientMessages />}
            {currentView === 'client-invoices' && <ClientInvoices />}
            {currentView === 'client-referral' && <ClientReferral />}
            {currentView === 'client-profile' && <ClientProfile />}

            {/* ADMIN VIEWS */}
            {currentView === 'admin-dashboard' && <AdminDashboard />}
            {currentView === 'admin-requests' && <AdminRequests />}
            {currentView === 'admin-request-detail' && <AdminRequestDetail />}
            {currentView === 'admin-messages' && <AdminMessages />}
            {currentView === 'admin-kpis' && <AdminKpis />}
            {currentView === 'admin-clients' && <AdminClients />}
            {currentView === 'admin-invoices' && <AdminInvoices />}
            {currentView === 'admin-reviews' && <AdminReviews />}
            {currentView === 'admin-referrals' && <AdminReferrals />}
            {currentView === 'admin-catalog' && <AdminCatalog />}
            {currentView === 'admin-team' && <AdminTeam />}
            {currentView === 'admin-audit' && <AdminAudit />}

            {/* OPERATOR VIEWS */}
            {currentView === 'operator-dashboard' && <OperatorDashboard />}
            {currentView === 'operator-missions' && <OperatorMissions />}
            {currentView === 'operator-mission-detail' && <OperatorMissionDetail />}
          </main>
        </div>
      </div>

      <ServiceDetailModal />
      <PhotoModal />
      <ConfirmDialog />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
