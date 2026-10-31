import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { AppProvider } from '@/context/AppContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'

// Lazy-loaded pages for fast initial bundle
const Overview = lazy(() => import('@/pages/Overview').then(m => ({ default: m.Overview })))
const Sales = lazy(() => import('@/pages/Sales').then(m => ({ default: m.Sales })))
const Forecasting = lazy(() => import('@/pages/Forecasting').then(m => ({ default: m.Forecasting })))
const Inventory = lazy(() => import('@/pages/Inventory').then(m => ({ default: m.Inventory })))
const Purchases = lazy(() => import('@/pages/Purchases').then(m => ({ default: m.Purchases })))
const Expenses = lazy(() => import('@/pages/Expenses').then(m => ({ default: m.Expenses })))
const Analytics = lazy(() => import('@/pages/Analytics').then(m => ({ default: m.Analytics })))
const Assistant = lazy(() => import('@/pages/Assistant').then(m => ({ default: m.Assistant })))
const Recommendations = lazy(() => import('@/pages/Recommendations').then(m => ({ default: m.Recommendations })))
const Reports = lazy(() => import('@/pages/Reports').then(m => ({ default: m.Reports })))
const Settings = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })))

const PageLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-slate-400 font-medium">Loading operational metrics...</span>
    </div>
  </div>
)

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Enterprise Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<AppLayout />}>
                <Route
                  index
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <Overview />
                    </Suspense>
                  }
                />
                <Route
                  path="sales"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <Sales />
                    </Suspense>
                  }
                />
                <Route
                  path="forecasting"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <Forecasting />
                    </Suspense>
                  }
                />
                <Route
                  path="inventory"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <Inventory />
                    </Suspense>
                  }
                />
                <Route
                  path="purchases"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <Purchases />
                    </Suspense>
                  }
                />
                <Route
                  path="expenses"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <Expenses />
                    </Suspense>
                  }
                />
                <Route
                  path="analytics"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <Analytics />
                    </Suspense>
                  }
                />
                <Route
                  path="assistant"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <Assistant />
                    </Suspense>
                  }
                />
                <Route
                  path="recommendations"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <Recommendations />
                    </Suspense>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <Reports />
                    </Suspense>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <Suspense fallback={<PageLoadingFallback />}>
                      <Settings />
                    </Suspense>
                  }
                />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  )
}

export default App
