import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { CartProvider } from './hooks/useCart'
import { AuthProvider } from './hooks/useAuth'
import { LangProvider } from './hooks/useLang'
import { OrderTypeProvider } from './hooks/useOrderType'
import { FullscreenProvider } from './hooks/useFullscreen'
import Header from './components/Header'
import Cart from './components/Cart'
import HomePage from './components/HomePage'
import MenuBrowser from './components/MenuBrowser'
import ReservationPage from './components/ReservationPage'
import Checkout from './components/Checkout'
import PaymentSuccess from './components/PaymentSuccess'
import AccountLogin from './components/AccountLogin'
import AccountDashboard from './components/AccountDashboard'
import BalanceHistory from './components/BalanceHistory'
import AdminSimulateReview from './components/AdminSimulateReview'
import KitchenDisplay from './components/KitchenDisplay'
import AdminPanel from './components/AdminPanel'
import DeliveryPanel from './components/DeliveryPanel'
import OrderTrack from './components/OrderTrack'
import InstallPrompt from './components/InstallPrompt'
import IntroOverlay from './components/IntroOverlay'
import Footer from './components/Footer'
import { FEATURES } from './config'

// Customer-facing pages only — admin/kitchen/delivery/account pages get no footer
const FOOTER_PATHS = ['/', '/menu', '/reservation', '/checkout', '/payment-success']

export default function App() {
  return (
    <>
    <IntroOverlay />
    <HashRouter>
      <OrderTypeProvider>
        <LangProvider>
          <AuthProvider>
            <CartProvider>
              <FullscreenProvider>
                <AppRoutes />
              </FullscreenProvider>
            </CartProvider>
          </AuthProvider>
        </LangProvider>
      </OrderTypeProvider>
    </HashRouter>
    </>
  )
}

function AppRoutes() {
  const { pathname } = useLocation()
  return (
    <>
      <Header />
      <Cart />
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/reservation" element={<ReservationPage />} />
        <Route path="/menu" element={<MenuBrowser />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/account" element={<AccountDashboard />} />
        <Route path="/account/login" element={<AccountLogin />} />
        <Route path="/balance/history" element={<BalanceHistory />} />
        <Route path="/admin/simulate-review" element={<AdminSimulateReview />} />
        <Route path="/kitchen" element={<KitchenDisplay />} />
        <Route path="/admin" element={<AdminPanel />} />
        {FEATURES.delivery && <Route path="/delivery" element={<DeliveryPanel />} />}
        <Route path="/track/:orderNumber" element={<OrderTrack />} />
      </Routes>
      {FOOTER_PATHS.includes(pathname) && <Footer />}
    </>
  )
}
