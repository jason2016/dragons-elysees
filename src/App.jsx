import { HashRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './hooks/useCart'
import { AuthProvider } from './hooks/useAuth'
import Header from './components/Header'
import HomePage from './components/HomePage'
import MenuBrowser from './components/MenuBrowser'
import Checkout from './components/Checkout'
import PaymentSuccess from './components/PaymentSuccess'
import AccountLogin from './components/AccountLogin'
import AccountDashboard from './components/AccountDashboard'
import KitchenDisplay from './components/KitchenDisplay'
import AdminPanel from './components/AdminPanel'

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </HashRouter>
  )
}

function AppRoutes() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuBrowser />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/account" element={<AccountDashboard />} />
        <Route path="/account/login" element={<AccountLogin />} />
        <Route path="/kitchen" element={<KitchenDisplay />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </>
  )
}
