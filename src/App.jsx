import { HashRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './hooks/useCart'
import { AuthProvider } from './hooks/useAuth'
import { LangProvider } from './hooks/useLang'
import { OrderTypeProvider } from './hooks/useOrderType'
import Header from './components/Header'
import Cart from './components/Cart'
import HomePage from './components/HomePage'
import MenuBrowser from './components/MenuBrowser'
import Checkout from './components/Checkout'
import PaymentSuccess from './components/PaymentSuccess'
import AccountLogin from './components/AccountLogin'
import AccountDashboard from './components/AccountDashboard'
import KitchenDisplay from './components/KitchenDisplay'
import AdminPanel from './components/AdminPanel'
import DeliveryPanel from './components/DeliveryPanel'
import OrderTrack from './components/OrderTrack'
import InstallPrompt from './components/InstallPrompt'
import { FEATURES } from './config'

export default function App() {
  return (
    <HashRouter>
      <OrderTypeProvider>
        <LangProvider>
          <AuthProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </AuthProvider>
        </LangProvider>
      </OrderTypeProvider>
    </HashRouter>
  )
}

function AppRoutes() {
  return (
    <>
      <Header />
      <Cart />
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuBrowser />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/account" element={<AccountDashboard />} />
        <Route path="/account/login" element={<AccountLogin />} />
        <Route path="/kitchen" element={<KitchenDisplay />} />
        <Route path="/admin" element={<AdminPanel />} />
        {FEATURES.delivery && <Route path="/delivery" element={<DeliveryPanel />} />}
        <Route path="/track/:orderNumber" element={<OrderTrack />} />
      </Routes>
    </>
  )
}
