import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import api from '../api.js';

import DashboardStats from './admin/DashboardStats.jsx';
import OrdersTab from './admin/OrdersTab.jsx';
import UsersTab from './admin/UsersTab.jsx';
import ProductsTab from './admin/ProductsTab.jsx';
import CouponsTab from './admin/CouponsTab.jsx';
import FeedbackTab from './admin/FeedbackTab.jsx';
import CustomerSupportTab from './admin/CustomerSupportTab.jsx';
import RevenueTab from './admin/RevenueTab.jsx';
import AdminAITab from './admin/AdminAITab.jsx';

// Status transition rules (matching backend)
const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

const STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ'
};

const ROLE_LABELS = {
  admin: 'Quản trị',
  staff: 'Nhân viên',
  user: 'Người dùng'
};

const getAvailableStatuses = (currentStatus) => {
  return STATUS_TRANSITIONS[currentStatus] || [];
};

const Admin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    brand: '',
    category: '',
    thumbnail: '',
    images: [],
    existingImages: [],
    imageFiles: [],
    variants: []
  });
  const [variantInput, setVariantInput] = useState({ storage: '', color: '', price: 0, stock: 0 });
  const [editingProductId, setEditingProductId] = useState(null);
  const [variantEditIndex, setVariantEditIndex] = useState(-1);
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'fixed',
    value: 0,
    minOrder: 0,
    expiredAt: '',
    usageLimit: 0,
    isActive: true,
    applyTo: 'order',
    productIds: []
  });
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [adminType, setAdminType] = useState('revenue');
  const [adminPrompt, setAdminPrompt] = useState('');
  const [adminInsight, setAdminInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [customerChats, setCustomerChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [adminReplyMessage, setAdminReplyMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(false);

  // Revenue chart states
  const [revenueData, setRevenueData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [chartType, setChartType] = useState('bar');
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const loadRevenueData = async () => {
    try {
      const { data } = await api.get('/dashboard/revenue/series', {
        params: { year: selectedYear, groupBy: 'month' }
      });
      setRevenueData(data);
    } catch (err) {
      console.error('Không tải được chuỗi doanh thu:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'report' && isAdmin) {
      loadRevenueData();
    }
  }, [activeTab, selectedYear, isAdmin]);

  const formatCurrency = (value) => {
    const number = Number(value || 0);
    if (Number.isNaN(number)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
  };

  const loadUsers = async () => {
    try {
      const params = userSearch ? { q: userSearch } : {};
      const { data } = await api.get('/admin/users', { params });
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách người dùng');
    }
  };

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/products');
      const uniqueProducts = Array.from(new Map(data.map((product) => [product._id, product])).values());
      setProducts(uniqueProducts);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách sản phẩm');
    }
  };

  const loadBrands = async () => {
    try {
      const { data } = await api.get('/brands');
      const uniqueBrands = Array.from(
        new Map(data.map((brand) => [brand.slug, brand])).values()
      );
      setBrands(uniqueBrands);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách thương hiệu');
      setBrands([]);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      const uniqueCategories = Array.from(
        new Map(data.map((category) => [category.slug, category])).values()
      );
      const defaultCategories = ['Smartphone', 'Tablet', 'Accessory'];
      const allCategories = [
        ...uniqueCategories,
        ...defaultCategories
          .map((name) => ({ _id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))
          .filter((item) => !uniqueCategories.some((cat) => cat.slug === item.slug))
      ];
      setCategories(allCategories);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách danh mục');
      const defaultCategories = ['Smartphone', 'Tablet', 'Accessory'];
      setCategories(defaultCategories.map((name) => ({ _id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') })));
    }
  };

  const loadFeedbacks = async () => {
    try {
      const { data } = await api.get('/admin/contacts');
      setFeedbacks(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được phản hồi');
    }
  };

  const loadOrders = async () => {
    try {
      const { data } = await api.get('/admin/orders');
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được đơn hàng');
    }
  };

  const loadCoupons = async () => {
    try {
      const { data } = await api.get('/coupons');
      setCoupons(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách coupon');
    }
  };

  const loadReport = async () => {
    try {
      const { data } = await api.get('/dashboard/overview');
      setReport(data);
      setReportError('');
    } catch (err) {
      const message = err.response?.data?.message || 'Không tải được báo cáo';
      setReportError(message);
      setError(message);
    }
  };

  const fetchAdminInsight = async () => {
    try {
      setLoadingInsight(true);
      setError('');
      const params = { type: adminType, prompt: adminPrompt };
      const { data } = await api.get('/ai/admin/insight', { params });
      setAdminInsight(data.insight);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể lấy insight AI');
    } finally {
      setLoadingInsight(false);
    }
  };

  const loadCustomerChats = async () => {
    try {
      setLoadingChats(true);
      setError('');
      const { data } = await api.get('/ai/admin/chats');
      setCustomerChats(data.chats || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải chat khách hàng');
      setCustomerChats([]);
    } finally {
      setLoadingChats(false);
    }
  };

  const sendAdminReply = async () => {
    if (!adminReplyMessage.trim() || !selectedChat) return;
    try {
      setError('');
      await api.post('/ai/admin/reply', {
        userId: selectedChat.userId?._id || selectedChat.userId,
        message: adminReplyMessage
      });
      setAdminReplyMessage('');
      await loadCustomerChats();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi trả lời');
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadReport();
    }
    loadOrders();
    loadProducts();
    loadBrands();
    loadCategories();
    loadFeedbacks();
    loadCoupons();
  }, [isAdmin]);

  useEffect(() => {
    let intervalId;
    if (activeTab === 'customer-support' && (isAdmin || isStaff)) {
      loadCustomerChats();
      intervalId = setInterval(loadCustomerChats, 10000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab, isAdmin, isStaff]);

  const handleUserToggle = async (userId, isBlocked) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { isBlocked: !isBlocked });
      loadUsers();
    } catch (err) {
      setError('Không thể cập nhật trạng thái người dùng');
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.post('/admin/users', newUser);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tạo người dùng');
    }
  };

  const handleEditUser = (user) => {
    setEditingUserId(user._id);
    setNewUser({ name: user.name || '', email: user.email || '', password: '', role: user.role || 'user' });
    setError('');
    setMessage('');
  };

  const handleUpdateUser = async () => {
    try {
      const payload = { name: newUser.name, email: newUser.email, role: newUser.role };
      if (newUser.password) payload.password = newUser.password;
      await api.put(`/admin/users/${editingUserId}`, payload);
      setEditingUserId(null);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      setMessage('Cập nhật người dùng thành công');
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật người dùng');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      if (!window.confirm('Bạn có chắc muốn xoá tài khoản này?')) return;
      const { data } = await api.delete(`/admin/users/${userId}`);
      setMessage(data?.message || 'Đã xoá người dùng');
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xoá người dùng');
    }
  };

  const handleUpdateOrder = async (orderId, status) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      loadOrders();
    } catch (err) {
      setError('Không thể cập nhật trạng thái đơn hàng');
    }
  };

  const viewOrder = async (orderId) => {
    try {
      const { data } = await api.get(`/admin/orders/${orderId}`);
      setSelectedOrder(data);
    } catch (err) {
      setError('Không thể tải chi tiết đơn hàng');
    }
  };

  const closeOrderModal = () => setSelectedOrder(null);

  const exportOrders = async () => {
    try {
      const res = await api.get('/admin/orders/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'orders.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Không thể xuất đơn hàng');
    }
  };

  const exportProducts = async () => {
    try {
      const res = await api.get('/products/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Không thể xuất sản phẩm');
    }
  };

  const exportRevenue = async () => {
    try {
      const res = await api.get('/dashboard/revenue/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'revenue-report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Không thể xuất báo cáo doanh thu');
    }
  };

  const handleSaveProduct = async () => {
    try {
      const formData = new FormData();
      const existingImages = Array.from(new Set((productForm.existingImages || []).filter(Boolean)));
      formData.append('name', productForm.name);
      formData.append('description', productForm.description);
      formData.append('brand', productForm.brand);
      formData.append('category', productForm.category);
      formData.append('thumbnail', productForm.thumbnail || '');
      formData.append('variants', JSON.stringify(productForm.variants));
      formData.append('existingImages', JSON.stringify(existingImages));

      const uniqueImageFiles = [];
      const fileKeys = new Set();
      productForm.imageFiles.forEach((file) => {
        const key = `${file.name}-${file.size}-${file.type}`;
        if (!fileKeys.has(key)) {
          fileKeys.add(key);
          uniqueImageFiles.push(file);
        }
      });

      uniqueImageFiles.forEach((file) => {
        formData.append('images', file);
      });

      if (editingProductId) {
        await api.put(`/products/${editingProductId}`, formData);
      } else {
        await api.post('/products', formData);
      }

      setEditingProductId(null);
      setProductForm({
        name: '',
        description: '',
        brand: '',
        category: '',
        thumbnail: '',
        images: [],
        existingImages: [],
        imageFiles: [],
        variants: []
      });
      setVariantInput({ storage: '', color: '', price: 0, stock: 0 });
      loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể lưu sản phẩm');
    }
  };

  const getProductNameById = (id) => {
    const product = products.find((item) => item._id === id);
    return product ? product.name : id;
  };

  const handleCouponFormChange = (field, value) => {
    setCouponForm({
      ...couponForm,
      [field]: value
    });
  };

  const handleCouponProductsChange = (event) => {
    const options = Array.from(event.target.selectedOptions || []);
    handleCouponFormChange('productIds', options.map((option) => option.value));
  };

  const resetCouponForm = () => {
    setEditingCouponId(null);
    setCouponForm({
      code: '',
      type: 'fixed',
      value: 0,
      minOrder: 0,
      expiredAt: '',
      usageLimit: 0,
      isActive: true,
      applyTo: 'order',
      productIds: []
    });
  };

  const handleEditCoupon = (coupon) => {
    setEditingCouponId(coupon._id);
    setCouponForm({
      code: coupon.code || '',
      type: coupon.type || 'fixed',
      value: coupon.value || 0,
      minOrder: coupon.minOrder || 0,
      expiredAt: coupon.expiredAt ? coupon.expiredAt.slice(0, 10) : '',
      usageLimit: coupon.usageLimit || 0,
      isActive: coupon.isActive !== false,
      applyTo: coupon.applyTo || 'order',
      productIds: coupon.productIds?.map((id) => id.toString()) || []
    });
  };

  const handleDeleteCoupon = async (couponId) => {
    try {
      await api.delete(`/coupons/${couponId}`);
      loadCoupons();
    } catch (err) {
      setError('Không thể xoá coupon');
    }
  };

  const handleSaveCoupon = async () => {
    try {
      const payload = {
        code: couponForm.code,
        type: couponForm.type,
        value: Number(couponForm.value),
        minOrder: Number(couponForm.minOrder),
        expiredAt: couponForm.expiredAt || undefined,
        usageLimit: Number(couponForm.usageLimit),
        isActive: couponForm.isActive,
        applyTo: couponForm.applyTo,
        productIds: couponForm.applyTo === 'product' ? couponForm.productIds : []
      };

      if (editingCouponId) {
        await api.put(`/coupons/${editingCouponId}`, payload);
      } else {
        await api.post('/coupons', payload);
      }

      resetCouponForm();
      loadCoupons();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể lưu coupon');
    }
  };

  const handleCancelCouponEdit = () => {
    resetCouponForm();
  };

  const handleImageFilesChange = async (event) => {
    const files = Array.from(event.target.files);
    const existingKeys = new Set((productForm.imageFiles || []).map((file) => `${file.name}-${file.size}-${file.type}`));
    const newFiles = files.filter((file) => {
      const key = `${file.name}-${file.size}-${file.type}`;
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });

    if (newFiles.length === 0) return;

    try {
      const dataUrls = await Promise.all(
        newFiles.map((file) => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }))
      );

      setProductForm({
        ...productForm,
        imageFiles: [...(productForm.imageFiles || []), ...newFiles],
        images: Array.from(new Set([...(productForm.images || []), ...dataUrls]))
      });
    } catch (err) {
      setError('Lỗi khi tải ảnh');
    }
  };

  const handleAddVariant = () => {
    if (!variantInput.storage || !variantInput.color || !variantInput.price) {
      setError('Vui lòng nhập đầy đủ dung lượng, màu sắc và giá cho variant');
      return;
    }

    const storageValue = variantInput.storage.trim();
    const colorValue = variantInput.color.trim();
    const variantData = {
      storage: storageValue,
      color: colorValue,
      price: Number(variantInput.price),
      stock: Number(variantInput.stock),
      sku: `${storageValue}-${colorValue}`
    };

    if (Number.isNaN(variantData.price) || variantData.price < 0) {
      setError('Giá variant phải là số hợp lệ lớn hơn hoặc bằng 0');
      return;
    }

    if (Number.isNaN(variantData.stock) || variantData.stock < 0) {
      setError('Số lượng tồn phải là số hợp lệ lớn hơn hoặc bằng 0');
      return;
    }

    const existing = productForm.variants.find((v, idx) =>
      v.storage?.trim().toLowerCase() === variantData.storage.toLowerCase() &&
      v.color?.trim().toLowerCase() === variantData.color.toLowerCase() &&
      idx !== variantEditIndex
    );
    if (existing) {
      setError('Variant với dung lượng và màu sắc này đã tồn tại');
      return;
    }

    let variants = [...productForm.variants];
    if (variantEditIndex >= 0 && variantEditIndex < variants.length) {
      variants[variantEditIndex] = variantData;
      setVariantEditIndex(-1);
    } else {
      variants.push(variantData);
    }

    setProductForm({
      ...productForm,
      variants
    });
    setVariantInput({ storage: '', color: '', price: 0, stock: 0 });
    setError('');
  };

  const handleEditVariant = (variant, index) => {
    setVariantEditIndex(index);
    setVariantInput({
      storage: variant.storage || '',
      color: variant.color || '',
      price: variant.price || 0,
      stock: variant.stock || 0
    });
    setError('');
  };

  const handleCancelVariantEdit = () => {
    setVariantEditIndex(-1);
    setVariantInput({ storage: '', color: '', price: 0, stock: 0 });
    setError('');
  };

  const handleRemoveVariant = (index) => {
    const variants = productForm.variants.filter((_, idx) => idx !== index);
    setProductForm({ ...productForm, variants });
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      brand: product.brand || product.brandRef?.name || '',
      category: product.category || product.categoryRef?.name || '',
      thumbnail: product.thumbnail || product.images?.[0] || '',
      images: [...(product.images || [])],
      existingImages: [...(product.images || [])],
      imageFiles: [],
      variants: [...(product.variants || [])]
    });
    setVariantInput({ storage: '', color: '', price: 0, stock: 0 });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setProductForm({
      name: '',
      description: '',
      brand: '',
      category: '',
      thumbnail: '',
      images: [],
      existingImages: [],
      imageFiles: [],
      variants: []
    });
    setVariantInput({ storage: '', color: '', price: 0, stock: 0 });
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await api.delete(`/products/${productId}`);
      loadProducts();
    } catch (err) {
      setError('Không thể xoá sản phẩm');
    }
  };

  const viewFeedback = async (feedbackId) => {
    try {
      const { data } = await api.get(`/admin/contacts/${feedbackId}`);
      setSelectedFeedback(data);
    } catch (err) {
      setError('Không thể tải chi tiết phản hồi');
    }
  };

  const closeFeedbackModal = () => setSelectedFeedback(null);

  const handleUpdateFeedbackStatus = async (feedbackId, status) => {
    try {
      await api.put(`/admin/contacts/${feedbackId}/status`, { status });
      loadFeedbacks();
    } catch (err) {
      setError('Không thể cập nhật trạng thái phản hồi');
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedFeedback) return;
    try {
      await api.put(`/admin/contacts/${selectedFeedback._id}/status`, {
        reply: replyMessage,
        status: 'in_progress'
      });
      setReplyMessage('');
      setSelectedFeedback(null);
      loadFeedbacks();
    } catch (err) {
      setError('Không thể gửi trả lời');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const BREADCRUMB_LABELS = {
    orders: 'Đơn Hàng',
    users: 'Người Dùng',
    products: 'Sản Phẩm',
    coupons: 'Mã Giảm Giá',
    feedback: 'Ý Kiến & Phản Hồi',
    'customer-support': 'Hỗ Trợ Trực Tuyến',
    report: 'Báo Cáo Doanh Thu',
    'admin-ai': 'AI Quản Trị Hệ Thống'
  };

  return (
    <>
      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-icon">⚙️</div>
          <div className="admin-sidebar-logo-text">
            <h2>TechStore</h2>
            <span>ADMINISTRATOR</span>
          </div>
        </div>

        <nav className="admin-sidebar-menu">
          <button
            className={`admin-sidebar-link ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setSidebarOpen(false); }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span>Đơn hàng</span>
          </button>
          {isAdmin && (
            <button
              className={`admin-sidebar-link ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Người dùng</span>
            </button>
          )}
          <button
            className={`admin-sidebar-link ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => { setActiveTab('products'); setSidebarOpen(false); }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
              <polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08" />
              <polygon points="12 22.08 12 12 21 6.92 21 17.08 12 22.08" />
              <polygon points="12 12 3 6.92 12 1.84 21 6.92 12 12" />
            </svg>
            <span>Sản phẩm</span>
          </button>
          <button
            className={`admin-sidebar-link ${activeTab === 'coupons' ? 'active' : ''}`}
            onClick={() => { setActiveTab('coupons'); setSidebarOpen(false); }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            <span>Mã giảm giá</span>
          </button>
          <button
            className={`admin-sidebar-link ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => { setActiveTab('feedback'); setSidebarOpen(false); }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Phản hồi</span>
          </button>
          {(isAdmin || isStaff) && (
            <button
              className={`admin-sidebar-link ${activeTab === 'customer-support' ? 'active' : ''}`}
              onClick={() => { setActiveTab('customer-support'); setSidebarOpen(false); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>Hỗ trợ Chat</span>
            </button>
          )}
          {isAdmin && (
            <button
              className={`admin-sidebar-link ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => { setActiveTab('report'); setSidebarOpen(false); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Doanh thu</span>
            </button>
          )}
          {isAdmin && (
            <button
              className={`admin-sidebar-link ${activeTab === 'admin-ai' ? 'active' : ''}`}
              onClick={() => { setActiveTab('admin-ai'); setSidebarOpen(false); }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
              <span>AI Quản trị</span>
            </button>
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-avatar">
            {user?.name ? user.name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'A'}
          </div>
          <div className="admin-sidebar-userinfo">
            <div className="admin-sidebar-username">{user?.name || user?.email}</div>
            <div className="admin-sidebar-role">{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</div>
          </div>
          <button className="admin-sidebar-logout" onClick={handleLogout} title="Đăng xuất">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 99,
            backdropFilter: 'blur(4px)',
            transition: 'opacity 0.3s ease'
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="admin-main-wrapper">
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="admin-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="admin-topbar-breadcrumb">
              <span>Admin</span>
              <span className="separator">&gt;</span>
              <span className="current">
                {BREADCRUMB_LABELS[activeTab] || activeTab}
              </span>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <span
              style={{
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--adm-text-muted)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--adm-border)'
              }}
            >
              Xin chào, {user?.name || user?.email}
            </span>
          </div>
        </header>

        <main className="admin-page-content">
          {error && <div className="alert error">{error}</div>}
          {message && <div className="alert success">{message}</div>}

          {/* Core Dashboard widgets grid */}
          <DashboardStats
            orders={orders}
            products={products}
            feedbacks={feedbacks}
            report={report}
            isAdmin={isAdmin}
            formatCurrency={formatCurrency}
          />

          {/* Active Tab View router */}
          {activeTab === 'orders' && (
            <OrdersTab
              orders={orders}
              STATUS_LABELS={STATUS_LABELS}
              getAvailableStatuses={getAvailableStatuses}
              handleUpdateOrder={handleUpdateOrder}
              viewOrder={viewOrder}
              exportOrders={exportOrders}
              selectedOrder={selectedOrder}
              closeOrderModal={closeOrderModal}
              formatCurrency={formatCurrency}
            />
          )}

          {activeTab === 'users' && isAdmin && (
            <UsersTab
              users={users}
              userSearch={userSearch}
              setUserSearch={setUserSearch}
              newUser={newUser}
              setNewUser={setNewUser}
              loadUsers={loadUsers}
              editingUserId={editingUserId}
              setEditingUserId={setEditingUserId}
              handleCreateUser={handleCreateUser}
              handleUpdateUser={handleUpdateUser}
              handleUserToggle={handleUserToggle}
              handleEditUser={handleEditUser}
              handleDeleteUser={handleDeleteUser}
              ROLE_LABELS={ROLE_LABELS}
              error={error}
              message={message}
              setError={setError}
              setMessage={setMessage}
            />
          )}

          {activeTab === 'products' && (
            <ProductsTab
              products={products}
              exportProducts={exportProducts}
              editingProductId={editingProductId}
              productForm={productForm}
              setProductForm={setProductForm}
              brands={brands}
              categories={categories}
              handleImageFilesChange={handleImageFilesChange}
              variantInput={variantInput}
              setVariantInput={setVariantInput}
              handleAddVariant={handleAddVariant}
              variantEditIndex={variantEditIndex}
              handleCancelVariantEdit={handleCancelVariantEdit}
              handleEditVariant={handleEditVariant}
              handleRemoveVariant={handleRemoveVariant}
              handleSaveProduct={handleSaveProduct}
              handleCancelEdit={handleCancelEdit}
              handleEditProduct={handleEditProduct}
              handleDeleteProduct={handleDeleteProduct}
              formatCurrency={formatCurrency}
            />
          )}

          {activeTab === 'coupons' && (
            <CouponsTab
              coupons={coupons}
              couponForm={couponForm}
              setCouponForm={setCouponForm}
              editingCouponId={editingCouponId}
              resetCouponForm={resetCouponForm}
              handleEditCoupon={handleEditCoupon}
              handleDeleteCoupon={handleDeleteCoupon}
              handleSaveCoupon={handleSaveCoupon}
              handleCancelCouponEdit={handleCancelCouponEdit}
              products={products}
              handleCouponFormChange={handleCouponFormChange}
              handleCouponProductsChange={handleCouponProductsChange}
            />
          )}

          {activeTab === 'feedback' && (
            <FeedbackTab
              feedbacks={feedbacks}
              loadFeedbacks={loadFeedbacks}
              viewFeedback={viewFeedback}
              handleUpdateFeedbackStatus={handleUpdateFeedbackStatus}
              selectedFeedback={selectedFeedback}
              setSelectedFeedback={setSelectedFeedback}
              replyMessage={replyMessage}
              setReplyMessage={setReplyMessage}
              handleReply={handleReply}
              closeFeedbackModal={closeFeedbackModal}
            />
          )}

          {activeTab === 'customer-support' && (isAdmin || isStaff) && (
            <CustomerSupportTab
              customerChats={customerChats}
              selectedChat={selectedChat}
              setSelectedChat={setSelectedChat}
              loadCustomerChats={loadCustomerChats}
              adminReplyMessage={adminReplyMessage}
              setAdminReplyMessage={setAdminReplyMessage}
              sendAdminReply={sendAdminReply}
            />
          )}

          {activeTab === 'report' && isAdmin && (
            <RevenueTab
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              chartType={chartType}
              setChartType={setChartType}
              exportRevenue={exportRevenue}
              reportError={reportError}
              report={report}
              revenueData={revenueData}
              hoveredIndex={hoveredIndex}
              setHoveredIndex={setHoveredIndex}
              formatCurrency={formatCurrency}
            />
          )}

          {activeTab === 'admin-ai' && isAdmin && (
            <AdminAITab
              adminType={adminType}
              setAdminType={setAdminType}
              adminPrompt={adminPrompt}
              setAdminPrompt={setAdminPrompt}
              fetchAdminInsight={fetchAdminInsight}
              loadingInsight={loadingInsight}
              adminInsight={adminInsight}
            />
          )}
        </main>
      </div>
    </>
  );
};

export default Admin;
