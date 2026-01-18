import React, { useState, useEffect } from 'react';
import {
  Leaf, MapPin, Zap, Activity, ChefHat, ArrowRight, Check, Droplets, Sun,
  Loader, Bike, Heart, BarChart3, Info, AlertTriangle, TrendingUp, Grid,
  Gift, Wallet, Coins, ShoppingBag, User, ShieldCheck, LogOut, DollarSign,
  Truck, PlusCircle, Clock, FileText, Wind, Layers, Target, Flame, Settings,
  Map, Navigation, Server, Cpu, Database, Battery, BatteryCharging, AlertOctagon,
  Package, ClipboardList, Award, ChevronRight, X, Menu
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, ScatterChart, Scatter, ZAxis, PieChart, Pie, LineChart, Line, Legend, ComposedChart, CartesianGrid
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || "https://verdant-ecosystem.onrender.com/api";
const USER_ID = "user_1";
const ORDER_STATUSES = ["Placed", "Preparing", "Out for Delivery", "Delivered"];
const CATEGORY_COLORS = { "Vegan": "#10b981", "High-Protein": "#f59e0b", "Balanced": "#6366f1", "Superfood": "#ec4899", "Seafood": "#0ea5e9", "Main Course": "#10b981", "Fast Food": "#f59e0b", "Italian": "#6366f1", "Japanese": "#ec4899", "Chinese": "#0ea5e9", "Drinks": "#8b5cf6", "Dessert": "#f43f5e", "Healthy": "#84cc16", "Breakfast": "#eab308", "South Indian": "#d946ef", "Breads": "#a855f7", "Soups": "#14b8a6", "Starter": "#f97316" };
const CLUSTER_COLORS = { "Titanium": "#475569", "Gold": "#f59e0b", "Silver": "#94a3b8", "Bronze": "#d97706" };


export default function VerdantApp() {
  const [view, setView] = useState('login');
  const [currentRole, setCurrentRole] = useState(null);

  // Data States
  const [userProfile, setUserProfile] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [matrixData, setMatrixData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [menuMatrix, setMenuMatrix] = useState([]);
  const [churnList, setChurnList] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 10,
    totalRevenue: 0,
    activeOrders: 0,
    totalMenuItems: 0
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [targetProt, setTargetProt] = useState(0);
  const [targetCal, setTargetCal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- API CALLS ---
  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API_URL}/user?id=${USER_ID}`);
      const data = await res.json();
      if (data.profile) {
        setUserProfile(data.profile);
        setOrderHistory(data.orders);
        setTargetProt(data.profile.daily_protein_goal);
        setTargetCal(data.profile.daily_cal_goal);
        if (data.penalty_alert) setNotification("⚠️ " + data.penalty_alert);
      }
      const fore = await fetch(`${API_URL}/forecast`).then(r => r.json());
      setForecastData(fore);
      const menu = await fetch(`${API_URL}/menu`).then(r => r.json());
      setMenuItems(menu);
    } catch (e) { console.error("Server Offline"); }
  };

  const fetchAdminData = async () => {
    try {
      const mat = await fetch(`${API_URL}/matrix?count=500`).then(r => r.json());
      setMatrixData(mat);
      const fore = await fetch(`${API_URL}/forecast`).then(r => r.json());
      setForecastData(fore);
      const route = await fetch(`${API_URL}/route`).then(r => r.json());
      setRouteData(route);
      const orders = await fetch(`${API_URL}/admin/orders`).then(r => r.json());
      setAdminOrders(orders);
      const menu = await fetch(`${API_URL}/menu`).then(r => r.json());
      setMenuItems(menu);
      const mm = await fetch(`${API_URL}/admin/intelligence/menu-matrix`).then((r) => r.json());
      setMenuMatrix(mm);
      const cl = await fetch(`${API_URL}/admin/intelligence/churn-risk`).then((r) => r.json());
      setChurnList(cl);

      // Calculate stats
      const stats = await fetch(`${API_URL}/admin/stats`).then(r => r.json());
      setAdminStats({
        totalUsers: stats.total_users,
        totalRevenue: parseFloat(stats.total_revenue || 0),
        activeOrders: stats.active_orders,
        totalMenuItems: stats.total_menu_items
      });
    } catch (e) { console.error("Ensure C Backend is running"); }
  };

  useEffect(() => {
    if (currentRole === 'user' && view !== 'login') fetchUserData();
    if (currentRole === 'admin') fetchAdminData();
  }, [view, currentRole]);

  // --- HANDLERS ---
  const handleOrder = async (item) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/order/place`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID, items: [item] })
      });
      const data = await res.json();
      if (data.success) {
        setNotification(`Order Placed! Earned Points & Logged Nutrition.`);
        setUserProfile(prev => ({ ...prev, wallet: data.new_wallet, green_points: data.new_points, today_protein: data.today_protein, today_cals: data.today_cals }));
        setTrackedOrder(data.order);
      } else { setNotification(`Error: ${data.error}`); }
    } catch (e) { setNotification("Server Connection Failed"); }
    setLoading(false);
    setTimeout(() => setNotification(null), 3000);
  };

  const addFunds = async (amount) => {
    if (!amount || amount <= 0) {
      setNotification("Please enter a valid amount");
      setTimeout(() => setNotification(null), 2000);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/wallet/add`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID, amount: parseFloat(amount) })
      });
      const data = await res.json();
      if (data.success) {
        setNotification(`✅ Added ₹${amount} to Wallet via ${selectedPayment.toUpperCase()}!`);
        setUserProfile(prev => ({ ...prev, wallet: data.new_balance }));
        setShowWalletModal(false);
        setCustomAmount('');
      }
    } catch (e) { setNotification("Failed to add funds"); }
    setLoading(false);
    setTimeout(() => setNotification(null), 3000);
  };

  const saveGoals = async () => {
    try {
      const res = await fetch(`${API_URL}/user/set_goals`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID, protein: targetProt, cals: targetCal })
      });
      const data = await res.json();
      if (data.success) { setUserProfile(data.profile); setShowGoalModal(false); setNotification("Daily Goals Updated!"); }
    } catch (e) { setNotification("Failed to save goals"); }
    setTimeout(() => setNotification(null), 2000);
  };

  const analyzeNutrition = async (item) => {
    setLoadingAI(true); setAiAnalysis(null);
    try {
      const res = await fetch(`${API_URL}/nutrition`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item)
      });
      const data = await res.json();
      setAiAnalysis(data);
    } catch (e) { setAiAnalysis({ verdict: "Server Error", bio_score: 0 }); }
    setLoadingAI(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/admin/order/update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setAdminOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        setNotification(`Order updated to ${newStatus}`);
      }
    } catch (e) { console.error("Failed to update"); }
    setTimeout(() => setNotification(null), 2000);
  };

  const redeemPoints = async () => {
    if (userProfile && userProfile.green_points >= 100) {
      setUserProfile(prev => ({ ...prev, green_points: prev.green_points - 100, wallet: prev.wallet + 50.0 }));
      setNotification("Redeemed 100 Points for ₹50.00!");
    } else { setNotification("Insufficient Points (Need 100)"); }
    setTimeout(() => setNotification(null), 2000);
  };

  // --- COMPONENTS ---

  const LayoutReactIcon = ({ size, className }) => (
    <svg width={size} height={size} viewBox="-11.5 -10.23174 23 20.46348" className={className}><circle cx="0" cy="0" r="2.05" fill="currentColor" /><g stroke="currentColor" strokeWidth="1" fill="none"><ellipse rx="11" ry="4.2" /><ellipse rx="11" ry="4.2" transform="rotate(60)" /><ellipse rx="11" ry="4.2" transform="rotate(120)" /></g></svg>
  );

  const LogisticsMap = () => {
    if (!routeData) return <div className="h-64 flex items-center justify-center text-slate-400"><Loader className="animate-spin mr-2" /> 2-Opt Optimization Running...</div>;
    return (
      <div className="relative w-full h-96 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden p-4 shadow-inner">
        <div className="absolute top-4 right-4 bg-white p-3 rounded-xl shadow-lg border border-slate-100 z-10">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">Efficiency</div>
          <div className="text-xl font-bold text-indigo-600">{routeData.total_distance.toFixed(1)} km</div>
        </div>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline points={routeData.stops.map(s => `${s.x},${s.y}`).join(' ')} fill="none" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="2 1" />
          {routeData.stops.map((stop, idx) => (
            <g key={idx}>
              <circle cx={stop.x} cy={stop.y} r={stop.type === 'HUB' ? 3 : 1.5} fill={stop.type === 'HUB' ? '#ef4444' : '#10b981'} />
              {stop.type === 'HUB' && <text x={stop.x} y={stop.y - 5} fontSize="3" textAnchor="middle" fill="#ef4444" fontWeight="bold">HUB</text>}
              <text x={stop.x} y={stop.y + 4} fontSize="2" textAnchor="middle" fill="#64748b">{idx}</text>
            </g>
          ))}
        </svg>
        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">*2-Opt Optimized Route</div>
      </div>
    );
  };

  const FleetMonitor = () => {
    const activeDeliveries = adminOrders.filter(o => o.status === 'Out for Delivery');

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Truck className="text-orange-500" /> Fleet Command</h3>
          <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Live</span>
        </div>
        <div className="grid grid-cols-2 gap-4 p-6">
          {activeDeliveries.length > 0 ? activeDeliveries.slice(0, 4).map(order => (
            <div key={order.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-slate-700">EV-{100 + (order.id % 900)}</div>
                <div className="text-xs text-slate-400">Order #{order.id}</div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-emerald-600">En Route</span>
              </div>
            </div>
          )) : (
            <div className="col-span-2 text-center text-slate-400 py-4 text-sm font-medium">All vehicles at station. Fleet Idle.</div>
          )}
        </div>
      </div>
    )
  };

  const DailyProgress = () => {
    if (!userProfile) return null;
    const p_pct = userProfile.daily_protein_goal > 0 ? (userProfile.today_protein / userProfile.daily_protein_goal) * 100 : 0;
    const c_pct = userProfile.daily_cal_goal > 0 ? (userProfile.today_cals / userProfile.daily_cal_goal) * 100 : 0;
    return (
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold flex items-center gap-2"><Target className="text-emerald-400" /> Daily Vitality</h3><button onClick={() => setShowGoalModal(true)} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded flex items-center gap-1"><Settings size={12} /> Goals</button></div>
        {userProfile.daily_protein_goal === 0 ? (
          <div className="text-center py-4 text-slate-400 text-sm">Set goals to avoid point penalties!<button onClick={() => setShowGoalModal(true)} className="block mx-auto mt-2 text-emerald-400 underline font-bold">Setup Now</button></div>
        ) : (
          <div className="space-y-4">
            <div><div className="flex justify-between text-xs mb-1 text-slate-300"><span>Protein ({userProfile.today_protein}g / {userProfile.daily_protein_goal}g)</span><span className={p_pct >= 100 ? "text-emerald-400 font-bold" : ""}>{p_pct.toFixed(0)}%</span></div><div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${p_pct >= 100 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${Math.min(p_pct, 100)}%` }}></div></div></div>
            <div><div className="flex justify-between text-xs mb-1 text-slate-300"><span>Calories ({userProfile.today_cals} / {userProfile.daily_cal_goal})</span><span className={c_pct >= 100 ? "text-emerald-400 font-bold" : ""}>{c_pct.toFixed(0)}%</span></div><div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${c_pct >= 100 ? "bg-emerald-500" : "bg-orange-500"}`} style={{ width: `${Math.min(c_pct, 100)}%` }}></div></div></div>
            <div className="text-[10px] text-slate-400 mt-2 bg-slate-800 p-2 rounded border border-slate-700 flex items-center gap-2"><AlertTriangle size={12} className="text-amber-500" /> Warning: 25% Point Penalty if goals missed!</div>
          </div>
        )}
      </div>
    );
  };

  const SystemFlowchart = () => (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
      <h2 className="text-2xl font-bold mb-8 flex items-center gap-2"><Cpu /> Enterprise Architecture</h2>
      <div className="flex items-center justify-between min-w-[800px] relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10"></div>
        <div className="flex flex-col items-center bg-white p-4 z-10"><div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center border-2 border-blue-500 shadow-lg"><LayoutReactIcon size={40} className="text-blue-600" /></div><div className="mt-3 font-bold text-slate-800">Frontend</div></div>
        <div className="flex flex-col items-center bg-white p-4 z-10"><div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-400"><ArrowRight size={24} className="text-slate-600" /></div></div>
        <div className="flex flex-col items-center bg-white p-4 z-10"><div className="w-20 h-20 bg-yellow-100 rounded-2xl flex items-center justify-center border-2 border-yellow-500 shadow-lg"><Server size={40} className="text-yellow-600" /></div><div className="mt-3 font-bold text-slate-800">Python API</div></div>
        <div className="flex flex-col items-center bg-white p-4 z-10"><div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-400"><ArrowRight size={24} className="text-slate-600" /></div></div>
        <div className="flex flex-col items-center bg-white p-4 z-10"><div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center border-2 border-emerald-500 shadow-lg"><Activity size={40} className="text-emerald-600" /></div><div className="mt-3 font-bold text-slate-800">C Engine</div></div>
      </div>
    </div>
  );

  // --- RENDER ---
  if (!currentRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-fade-in">
          <div className="mx-auto bg-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"><Leaf className="text-white" size={32} /></div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Verdant <span className="text-emerald-600">Enterprise</span></h1>
          <p className="text-slate-500 mb-8">AI-Driven Sustainable Logistics (Indian Ed.)</p>
          <button onClick={() => { setCurrentRole('user'); setView('home'); }} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold mb-3">User Portal</button>
          <button onClick={() => { setCurrentRole('admin'); setView('dashboard'); }} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold">Admin Console</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-bounce-in">
          {notification.includes("Error") || notification.includes("Warning") ? <AlertTriangle size={18} className="text-amber-400" /> : <Check size={18} className="text-emerald-400" />}
          <span className="font-bold text-sm">{notification}</span>
        </div>
      )}

      {showGoalModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Target className="text-indigo-600" /> Set Daily Goals</h2>
            <div className="space-y-4 mb-6">
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Protein (g)</label><input type="number" value={targetProt} onChange={e => setTargetProt(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl font-bold text-lg" /></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Calories (kcal)</label><input type="number" value={targetCal} onChange={e => setTargetCal(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl font-bold text-lg" /></div>
            </div>
            <div className="flex gap-2"><button onClick={() => setShowGoalModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button><button onClick={saveGoals} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold">Save</button></div>
          </div>
        </div>
      )}

      {showWalletModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowWalletModal(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full"></div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold flex items-center gap-2"><Wallet size={28} /> Add Funds</h2>
                  <button onClick={() => setShowWalletModal(false)} className="text-white/80 hover:text-white"><X size={24} /></button>
                </div>
                <p className="text-emerald-100 text-sm">Secure & Instant Payment</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Balance */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-xs font-bold text-slate-500 uppercase mb-1">Current Balance</div>
                <div className="text-3xl font-bold text-slate-800">₹{userProfile?.wallet.toFixed(2) || '0.00'}</div>
              </div>

              {/* Quick Amount Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Quick Select</label>
                <div className="grid grid-cols-3 gap-2">
                  {[100, 250, 500, 1000, 2000, 5000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setCustomAmount(amt.toString())}
                      className={`py-3 rounded-xl font-bold text-sm transition-all ${customAmount === amt.toString()
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Custom Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-10 pr-4 py-4 border-2 border-slate-200 rounded-xl font-bold text-lg focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'upi', label: 'UPI', icon: '📱' },
                    { id: 'card', label: 'Card', icon: '💳' },
                    { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
                    { id: 'wallet', label: 'E-Wallet', icon: '👛' }
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPayment(method.id)}
                      className={`p-3 rounded-xl border-2 transition-all ${selectedPayment === method.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                    >
                      <div className="text-2xl mb-1">{method.icon}</div>
                      <div className="text-xs font-bold">{method.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addFunds(customAmount)}
                  disabled={loading || !customAmount}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader size={18} className="animate-spin" /> : <><Check size={18} /> Add Funds</>}
                </button>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Secured by 256-bit SSL Encryption</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ADMIN SIDEBAR LAYOUT --- */}
      {currentRole === 'admin' ? (
        <>
          {/* Mobile Overlay */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar - Responsive */}
          <aside className={`
            w-64 bg-slate-900 text-slate-300 h-screen flex-shrink-0 flex flex-col
            fixed left-0 top-0 z-50 transition-transform duration-300
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-1.5 rounded-lg"><Leaf size={20} className="text-white" /></div>
                <span className="text-white font-bold text-lg tracking-tight">Verdant <span className="text-emerald-500">Ent.</span></span>
              </div>
              {/* Close button for mobile */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="p-4 space-y-1 flex-1">
              {[
                { id: 'dashboard', label: 'Overview', icon: LayoutReactIcon },
                { id: 'orders', label: 'Order Manager', icon: ClipboardList },
                { id: 'logistics', label: 'Logistics AI', icon: Map },
                { id: 'inventory', label: 'Smart Inventory', icon: Package },
                { id: 'matrix', label: 'Intelligence', icon: Database },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    setMobileMenuOpen(false); // Close menu on mobile after selection
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800'}`}
                >
                  <item.icon size={18} /> {item.label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button onClick={() => setCurrentRole(null)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-900/20 hover:text-red-400 transition-colors">
                <LogOut size={18} /> Logout
              </button>
            </div>
          </aside>

          {/* Main Content - Responsive margin */}
          <main className="flex-1 lg:ml-64 p-4 md:p-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <div className="flex items-center gap-3">
                {/* Hamburger Menu Button - Mobile Only */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Menu size={24} className="text-slate-700" />
                </button>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 capitalize">{view.replace('_', ' ')}</h1>
              </div>
              <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full shadow-sm border border-slate-200">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">AD</div>
                <div className="text-sm font-medium text-slate-600 hidden sm:block">Admin Console</div>
              </div>
            </div>

            {/* ADMIN VIEWS */}
            {view === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-slate-400 text-xs font-bold uppercase">Total Users</div>
                      <User size={20} className="text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-blue-600">{adminStats.totalUsers}</div>
                    <div className="text-xs text-slate-500 mt-1">Active customers</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-slate-400 text-xs font-bold uppercase">Total Revenue</div>
                      <DollarSign size={20} className="text-emerald-600" />
                    </div>
                    <div className="text-3xl font-bold text-emerald-600">₹{adminStats.totalRevenue.toFixed(0)}</div>
                    <div className="text-xs text-slate-500 mt-1">From {adminOrders.length} orders</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-slate-400 text-xs font-bold uppercase">Active Orders</div>
                      <ShoppingBag size={20} className="text-indigo-600" />
                    </div>
                    <div className="text-3xl font-bold text-indigo-600">{adminStats.activeOrders}</div>
                    <div className="text-xs text-slate-500 mt-1">Pending delivery</div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-slate-400 text-xs font-bold uppercase">Menu Items</div>
                      <ChefHat size={20} className="text-orange-600" />
                    </div>
                    <div className="text-3xl font-bold text-orange-600">{adminStats.totalMenuItems}</div>
                    <div className="text-xs text-slate-500 mt-1">Available dishes</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={18} /> Category Forecast</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={forecastData}><XAxis dataKey="day" fontSize={10} /><YAxis hide /><Tooltip /><Legend wrapperStyle={{ fontSize: '10px' }} />{Object.keys(CATEGORY_COLORS).map(cat => (<Bar key={cat} dataKey={cat} name={cat} stackId="a" fill={CATEGORY_COLORS[cat]} />))}</BarChart></ResponsiveContainer></div></div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Wind size={18} /> Carbon Analysis</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={forecastData}><defs><linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="day" fontSize={10} /><Tooltip /><Area type="monotone" dataKey="carbon_saved" stroke="#10b981" fill="url(#grad1)" strokeWidth={3} /></AreaChart></ResponsiveContainer></div></div>
                </div>
              </div>
            )}

            {view === 'inventory' && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-up">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold">Smart Inventory</h2>
                  <button className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg">Auto-Restock</button>
                </div>
                <div className="p-6">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                      <tr><th className="px-4 py-3">Ingredient</th><th className="px-4 py-3">Current Stock</th><th className="px-4 py-3">AI Prediction</th><th className="px-4 py-3">Status</th></tr>
                    </thead>
                    <tbody>
                      {menuItems.filter(i => i.stock <= 30).map(item => (
                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium text-slate-700">{item.name}</td>
                          <td className="px-4 py-3">{item.stock} units</td>
                          <td className="px-4 py-3 text-slate-500">Restock Recommended</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${item.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{item.stock < 10 ? 'Critical' : 'Low Stock'}</span></td>
                        </tr>
                      ))}
                      {menuItems.filter(i => i.stock <= 30).length === 0 && <tr><td colSpan="4" className="py-8 text-center text-slate-400">Inventory Levels Healthy</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === 'logistics' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                <div className="lg:col-span-2"><div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"><div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Map size={20} /> Live Fleet (2-Opt AI)</h3><span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded">C Engine</span></div><LogisticsMap /></div></div>
                <div className="space-y-6">
                  <FleetMonitor />
                  <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100"><h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2"><Zap size={18} /> Grid Optimization</h4><div className="text-3xl font-bold text-emerald-600 mb-1">99.1%</div><p className="text-xs text-emerald-600">Route optimization saved 42kWh today.</p></div>
                </div>
              </div>
            )}

            {view === 'matrix' && (
              <div className="space-y-6 animate-fade-in">

                {/* 1. KEY METRICS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CHART: Customer IQ (K-Means) */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg">
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <Database className="text-blue-600" /> Customer Clusters (AI)
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">4-Tier Segmentation based on Green Points & Spending</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis type="number" dataKey="x" name="Green Points" unit=" pts" fontSize={10} />
                          <YAxis type="number" dataKey="y" name="Spend" unit=" INR" fontSize={10} />
                          <ZAxis type="number" dataKey="z" range={[50, 400]} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-xs">
                                  <div className="font-bold text-slate-800 mb-1">{data.cluster} Segment</div>
                                  <div>Points: {data.x} | Spend: ₹{data.y}</div>
                                  <div className={`mt-1 font-bold ${data.churn > 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    Churn Risk: {data.churn}%
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          {Object.keys(CLUSTER_COLORS).map((cluster) => (
                            <Scatter key={cluster} name={cluster} data={matrixData.filter(d => d.cluster === cluster)} fill={CLUSTER_COLORS[cluster]} />
                          ))}
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* CHART: Menu Engineering (BCG Matrix) */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg">
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <ChefHat className="text-orange-600" /> Menu Engineering
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Popularity vs. Profitability (Price)</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis type="number" dataKey="popularity" name="Sales" unit="" fontSize={10} label={{ value: 'Popularity', position: 'insideBottom', offset: -10, fontSize: 10 }} />
                          <YAxis type="number" dataKey="price" name="Price" unit=" ₹" fontSize={10} label={{ value: 'Price (Profit)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                          <Tooltip content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-2 rounded text-xs shadow-xl">
                                  <div className="font-bold">{data.name}</div>
                                  <div>₹{data.price} | Sold: {data.popularity}</div>
                                  <div>{data.category}</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                          />
                          <Scatter name="Items" data={menuMatrix} fill="#8884d8">
                            {menuMatrix.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#8884d8'} />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* 2. FORECAST & RISK ROW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* FORECAST */}
                  <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-lg">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="text-emerald-600" /> Demand Forecast
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis dataKey="day" fontSize={12} />
                          <YAxis fontSize={12} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                          <Legend />
                          {Object.keys(CATEGORY_COLORS).map((category) => (
                            <Bar key={category} dataKey={category} stackId="a" fill={CATEGORY_COLORS[category]} name={category} />
                          ))}
                          <Line type="monotone" dataKey="carbon_saved" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} name="CO2 Saved" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* CHURN RISK LIST */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg overflow-hidden flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <AlertTriangle className="text-red-500" /> At Risk (Churn)
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                      {churnList.length === 0 ? (
                        <div className="text-center text-slate-400 text-sm py-4">All users are active!</div>
                      ) : (
                        churnList.map(user => (
                          <div key={user.id} className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100">
                            <div>
                              <div className="font-bold text-slate-800 text-sm">{user.name}</div>
                              <div className="text-[10px] text-red-500 font-medium">Inactive since {user.last_active.split('T')[0]}</div>
                            </div>
                            <button className="text-[10px] bg-white border border-red-200 text-red-600 px-2 py-1 rounded font-bold hover:bg-red-600 hover:text-white transition-colors">
                              Revive
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {view === 'orders' && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-up">
                <div className="p-6 border-b border-slate-100"><h2 className="text-xl font-bold">Order Management</h2></div>
                <div className="p-6 space-y-4">
                  {adminOrders.map(order => (
                    <div key={order.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="mb-4 md:mb-0">
                        <div className="flex items-center gap-2 mb-1"><span className="font-bold text-lg">{order.id}</span><span className={`text-xs px-2 py-1 rounded-full font-bold ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span></div>
                        <div className="text-sm text-slate-500">{order.user_name} • {order.address}</div>
                      </div>
                      <div className="flex gap-2">{ORDER_STATUSES.map(status => (<button key={status} onClick={() => updateOrderStatus(order.id, status)} className={`px-2 py-1 text-xs rounded border ${order.status === status ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'}`}>{status}</button>))}</div>
                    </div>
                  ))}
                  {adminOrders.length === 0 && <div className="text-center text-slate-400 py-8">No active orders found.</div>}
                </div>
              </div>
            )}
          </main>
        </>
      ) : (
        // --- USER PORTAL ---
        <div className="w-full p-4 md:p-8 max-w-7xl mx-auto">
          {/* Track Modal */}
          {trackedOrder && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setTrackedOrder(null)}>
              <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center"><div><div className="text-xs opacity-70 uppercase font-bold tracking-wider">Order Tracking</div><div className="text-2xl font-bold">{trackedOrder.id}</div></div><div className="bg-emerald-500/20 p-2 rounded-full"><Bike size={32} className="text-emerald-400" /></div></div>
                <div className="p-8"><div className="relative flex justify-between mb-8"><div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10"></div><div className="absolute top-1/2 left-0 h-1 bg-emerald-500 -z-10" style={{ width: `${(ORDER_STATUSES.indexOf(trackedOrder.status) / (ORDER_STATUSES.length - 1)) * 100}%` }}></div>{ORDER_STATUSES.map((step, idx) => { const isCompleted = ORDER_STATUSES.indexOf(trackedOrder.status) >= idx; return (<div key={step} className="flex flex-col items-center gap-2"><div className={`w-4 h-4 rounded-full border-2 ${isCompleted ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`}></div><span className={`text-xs font-bold ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{step}</span></div>) })}</div><button onClick={() => setTrackedOrder(null)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800">Close Tracking</button></div>
              </div>
            </div>
          )}

          <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
              <div className="bg-emerald-600 text-white p-2 rounded-xl"><Leaf size={24} /></div>
              <h1 className="text-2xl font-bold">Verdant</h1>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
              {userProfile && (<>
                <button onClick={() => setShowWalletModal(true)} className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-colors font-bold border border-emerald-200">
                  <Wallet size={18} /> ₹{userProfile.wallet.toFixed(2)}
                </button>
                <div className="hidden md:flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold border border-indigo-200">
                  <Coins size={18} /> {userProfile.green_points} pts
                </div>
              </>)}
              <button onClick={() => setCurrentRole(null)}><LogOut size={20} className="text-slate-400 hover:text-red-500" /></button>
            </div>
          </header>

          {view === 'home' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              <div className="space-y-6">
                <DailyProgress />
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Award className="text-orange-500" /> Your Badges</h3><span className="text-xs text-slate-400">Level 2</span></div>
                  <div className="flex gap-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600" title="Eco Warrior"><Leaf size={18} /></div>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600" title="Protein Champ"><Activity size={18} /></div>
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 border border-slate-200 border-dashed"><PlusCircle size={18} /></div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock className="text-blue-600" /> Recent Orders</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">{orderHistory.map(order => (<div key={order.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2"><div><div className="font-bold text-slate-800">{order.id}</div><div className="text-xs text-slate-500">{order.status}</div></div><button onClick={() => setTrackedOrder(order)} className="text-indigo-600 text-xs font-bold hover:text-indigo-800">Track</button></div>))}</div>
                </div>
                <button onClick={() => setView('user_forecast')} className="w-full py-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-600 hover:border-emerald-500 hover:text-emerald-600 flex items-center justify-center gap-2"><TrendingUp size={18} /> View Health Forecast</button>
                <button onClick={() => setView('user_rewards')} className="w-full py-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-600 hover:border-emerald-500 hover:text-emerald-600 flex items-center justify-center gap-2"><Gift size={18} /> Rewards Center</button>
              </div>
              <div className="lg:col-span-2 space-y-6">
                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                  {['All', ...new Set(menuItems.map(i => i.category))].map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}>
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems.filter(item => selectedCategory === 'All' || item.category === selectedCategory).map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                      <div className="h-32 relative">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-3">
                          <div className="text-white font-bold">{item.name}</div>
                          <div className="text-xs text-slate-300">{item.category}</div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-3 font-medium">
                          <span>🔥 {item.calories} kcal</span>
                          <span>💪 {item.protein}g</span>
                          <span className="text-emerald-600 font-bold">⭐ {item.sentiment ? item.sentiment.toFixed(1) : 'N/A'}</span>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <span className="text-[10px] bg-slate-100 px-2 py-1 rounded">Fat: {item.fat}g</span>
                          <span className="text-[10px] bg-slate-100 px-2 py-1 rounded">Carbs: {item.carbs}g</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg text-slate-800">₹{item.price}</span>
                          <div className="flex gap-1">
                            <button onClick={() => analyzeNutrition(item)} className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100">AI Check</button>
                            <button onClick={() => handleOrder(item)} className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-800">{loading ? <Loader size={14} className="animate-spin" /> : "Order"}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI MODAL MOVED OUTSIDE LOOP */}
                {aiAnalysis && loadingAI === false && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setAiAnalysis(null)}>
                    <div className="bg-white p-6 rounded-2xl max-w-sm w-full animate-slide-up" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg flex items-center gap-2"><Activity className="text-indigo-600" /> Bio-Score</h3><span className={`text-xl font-bold ${aiAnalysis.bio_score > 80 ? 'text-emerald-600' : 'text-amber-500'}`}>{aiAnalysis.bio_score.toFixed(0)}</span></div>
                      <p className="text-sm text-slate-600 font-bold mb-4">{aiAnalysis.verdict}</p>
                      <div className="space-y-2 text-xs text-slate-500 mb-6">
                        <div className="flex justify-between"><span>Fiber</span><span>{aiAnalysis.macros.fiber}g</span></div>
                        <div className="flex justify-between"><span>Sodium</span><span>{aiAnalysis.macros.sodium}mg</span></div>
                      </div>
                      <button onClick={() => setAiAnalysis(null)} className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold">Close</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'profile' && userProfile && (
            <div className="animate-fade-in pb-20">
              <button onClick={() => setView('home')} className="text-sm font-bold text-slate-500 hover:text-slate-800 flex gap-1 items-center mb-6"><ArrowRight className="rotate-180" size={14} /> Back Home</button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Enhanced Wallet Card */}
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                  <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full"></div>
                  <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-emerald-100">
                      <Wallet size={20} />
                      <span className="text-sm font-bold uppercase tracking-wide">Eco-Wallet</span>
                    </div>
                    <div className="text-5xl font-bold mb-6">₹{userProfile.wallet.toFixed(2)}</div>
                    <button onClick={() => setShowWalletModal(true)} className="w-full bg-white text-emerald-700 py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-emerald-50 transition-colors">
                      <PlusCircle size={18} /> Add Funds
                    </button>
                  </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock className="text-blue-600" /> Recent Transactions</h3>
                  <div className="space-y-3">
                    {orderHistory.slice(0, 5).map(order => (
                      <div key={order.id} className="flex justify-between items-center pb-3 border-b border-slate-50 last:border-0">
                        <div>
                          <div className="font-bold text-sm text-slate-800">{order.id}</div>
                          <div className="text-xs text-slate-500">{order.date}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">-₹{order.total.toFixed(2)}</div>
                          <div className="text-xs text-emerald-600">+{order.points} pts</div>
                        </div>
                      </div>
                    ))}
                    {orderHistory.length === 0 && (
                      <div className="text-center text-slate-400 py-8 text-sm">No transactions yet</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'user_forecast' && (
            <div className="animate-fade-in pb-20">
              <button onClick={() => setView('home')} className="text-sm font-bold text-slate-500 hover:text-slate-800 flex gap-1 items-center mb-6"><ArrowRight className="rotate-180" size={14} /> Back Home</button>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6"><h2 className="text-2xl font-bold text-slate-800 mb-2">My Diet Forecast</h2><p className="text-slate-500 text-sm mb-6">Predicted health adherence based on your recent orders.</p><div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={forecastData}><defs><linearGradient id="colorPredUser" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="day" fontSize={10} /><Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} /><Area type="monotone" dataKey="prediction" stroke="#10b981" strokeWidth={3} fill="url(#colorPredUser)" name="Health Score" /></AreaChart></ResponsiveContainer></div></div>
            </div>
          )}

          {view === 'user_rewards' && (
            <div className="animate-fade-in pb-20">
              <button onClick={() => setView('home')} className="text-sm font-bold text-slate-500 hover:text-slate-800 flex gap-1 items-center mb-6"><ArrowRight className="rotate-180" size={14} /> Back Home</button>
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-8 rounded-3xl shadow-xl mb-6 relative overflow-hidden"><Coins className="absolute -bottom-8 -right-8 text-indigo-500 opacity-30" size={180} /><div className="relative z-10 text-center"><div className="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-2">Total Green Points</div><div className="text-6xl font-bold mb-4">{userProfile ? userProfile.green_points : 0}</div><div className="inline-block bg-white/10 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border border-white/20">Value: ₹{((userProfile?.green_points || 0) / 2).toFixed(2)}</div></div></div>
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100"><h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Wallet className="text-emerald-500" /> Cash Conversion</h3><p className="text-sm text-slate-500 mb-6">Rate: 100 Pts = ₹50.00</p><button onClick={redeemPoints} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">Redeem 100 Points (₹50)</button></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}