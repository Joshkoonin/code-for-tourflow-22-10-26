import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Header } from './components/layout/Header';
import { ConflictBanner } from './components/conflicts/ConflictBanner';
import { ConflictView } from './components/conflicts/ConflictView';
import { ItineraryList } from './components/itinerary/ItineraryList';
import { ItineraryBuilder } from './components/itinerary/ItineraryBuilder';
import { LiveClientView } from './components/itinerary/LiveClientView';
import { TaskManager } from './components/tasks/TaskManager';
import { InvoicingHub } from './components/invoicing/InvoicingHub';
import { ExpenseTracker } from './components/expenses/ExpenseTracker';
import { ClientCRM } from './components/crm/ClientCRM';
import { SupplierTracker } from './components/suppliers/SupplierTracker';
import { ReportingDashboard } from './components/reporting/ReportingDashboard';
import { NewItineraryModal } from './components/itinerary/NewItineraryModal';
import { KeywordDescriptionLibrary } from './components/itinerary/KeywordDescriptionLibrary';
import { ActivitiesManager } from './components/activities/ActivitiesManager';
import { SupplierInvoicesHub } from './components/invoicing/SupplierInvoicesHub';
import { StaffLoginScreen } from './components/layout/StaffLoginScreen';
import { PassportManifestManager } from './components/passports/PassportManifestManager';
import { TourManagementArea } from './components/itinerary/TourManagementArea';
import { MultiPeriodPnLStatement } from './components/finance/MultiPeriodPnLStatement';
import { TourGrossProfitHub } from './components/finance/TourGrossProfitHub';
import { ToursCalendarHub } from './components/calendar/ToursCalendarHub';

function MainLayout() {
  const {
    activeView,
    setActiveView,
    selectedTripId,
    setSelectedTripId,
    clientPortalTripId,
    currentUser,
  } = useApp();

  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [calendarInitialDate, setCalendarInitialDate] = useState<string | undefined>(undefined);

  // Sync with browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'client') {
        setActiveView('client-portal');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setActiveView]);

  // If viewing standalone client portal (?view=client or activeView === 'client-portal')
  if (activeView === 'client-portal') {
    return (
      <LiveClientView
        tripId={clientPortalTripId || undefined}
        onBackToConsole={() => {
          setActiveView('itineraries');
          // Clean URL params back to standard
          const url = new URL(window.location.href);
          url.searchParams.delete('view');
          url.searchParams.delete('trip');
          url.searchParams.delete('day');
          window.history.pushState({}, '', url.toString());
        }}
      />
    );
  }

  // When page loads, staff members are logged out and must authenticate
  if (!currentUser) {
    return <StaffLoginScreen />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onNewItineraryClick={() => setIsNewTripModalOpen(true)}
          onNewTaskClick={() => setActiveView('tasks')}
        />

        {/* Global Conflict Alert Notification */}
        <ConflictBanner />

        {/* Dynamic View Router */}
        <main className="flex-1 overflow-y-auto">
          {activeView === 'dashboard' && <ReportingDashboard />}

          {activeView === 'itineraries' && (
            <ItineraryList
              onOpenBuilder={(tripId) => {
                setSelectedTripId(tripId);
                setActiveView('builder');
              }}
              onNewTrip={() => setIsNewTripModalOpen(true)}
            />
          )}

          {activeView === 'passports' && <PassportManifestManager />}

          {activeView === 'keywords' && <KeywordDescriptionLibrary />}
          {activeView === 'activities' && <ActivitiesManager />}

          {activeView === 'builder' && (
            <ItineraryBuilder
              tripId={selectedTripId || 'trip-1'}
              onBack={() => setActiveView('itineraries')}
            />
          )}

          {activeView === 'tasks' && <TaskManager />}

          {activeView === 'invoicing' && <InvoicingHub />}
          {activeView === 'supplier-invoices' && <SupplierInvoicesHub />}

          {activeView === 'expenses' && <ExpenseTracker />}

          {activeView === 'tour-management' && <TourManagementArea />}
          {activeView === 'pnl-reports' && <MultiPeriodPnLStatement />}

          {activeView === 'tours-calendar' && (
            <ToursCalendarHub
              onOpenNewTourModal={(date) => {
                setCalendarInitialDate(date);
                setIsNewTripModalOpen(true);
              }}
            />
          )}

          {activeView === 'tour-gross-profit' && <TourGrossProfitHub />}

          {activeView === 'crm' && <ClientCRM />}

          {activeView === 'suppliers' && <SupplierTracker />}

          {activeView === 'conflicts' && <ConflictView />}
        </main>
      </div>

      {/* New Itinerary Modal */}
      <NewItineraryModal
        isOpen={isNewTripModalOpen}
        initialDate={calendarInitialDate}
        onClose={() => {
          setIsNewTripModalOpen(false);
          setCalendarInitialDate(undefined);
        }}
        onCreated={(newTripId) => {
          setSelectedTripId(newTripId);
          setActiveView('builder');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
