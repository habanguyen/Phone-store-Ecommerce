import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Chatbox from './components/Chatbox.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Profile from './pages/Profile.jsx';
import Success from './pages/Success.jsx';
import Cancel from './pages/Cancel.jsx';
import Admin from './pages/Admin.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import './App.css';
import './styles/pages.css';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'admin' || user?.role === 'staff' ? children : <Navigate to="/" replace />;
};

function App() {
  const location = useLocation();
  const hideMainLayout = location.pathname.startsWith('/admin');

  return (
    <AuthProvider>
      <div className="app">
        <ScrollToTop />
        {!hideMainLayout && <Navbar />}
        <main className={hideMainLayout ? 'admin-main' : 'container'}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/success" element={<Success />} />
            <Route path="/cancel" element={<Cancel />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout>
                    <Admin />
                  </AdminLayout>
                </AdminRoute>
              }
            />
          </Routes>
        </main>
        {!hideMainLayout && <Chatbox />}
        {!hideMainLayout && <Footer />}
      </div>
    </AuthProvider>
  );
}

export default App;
