import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopNavbar } from './TopNavbar'
import { SearchModal } from './SearchModal'
import { QuickActionModal } from './QuickActionModal'
import { MultiFileImportModal } from '@/components/imports/MultiFileImportModal'
import { ToastContainer } from '@/components/ui/Toast'
import { useApp } from '@/context/AppContext'

export const AppLayout: React.FC = () => {
  const { toasts, removeToast, isImportModalOpen, setIsImportModalOpen, refreshData } = useApp()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-800 font-sans print:h-auto print:w-auto print:overflow-visible print:bg-white print:block">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:block print:w-full">
        {/* Top Navbar */}
        <TopNavbar />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:p-0 print:m-0 print:overflow-visible print:block print:w-full">
          <div className="max-w-7xl mx-auto space-y-6 print:max-w-none print:w-full print:m-0 print:space-y-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Modals & Overlays */}
      <div className="no-print">
        <SearchModal />
        <QuickActionModal />
        <MultiFileImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={refreshData}
        />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </div>
  )
}
