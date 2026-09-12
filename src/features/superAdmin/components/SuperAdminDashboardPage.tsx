import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../../../shared/api/axiosInstance';
import { SubscriptionModal } from './SubscriptionModal';
import { SubscriptionPlansManagement } from './SubscriptionPlansManagement';

interface Stats {
  totalOwners: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

interface Owner {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Invoice {
  id: string;
  reference: string;
  amount: number;
  status: string;
  issuedAt: string;
  dueDate: string;
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
}

interface Subscription {
  id: string;
  planName: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

// ---------------------------------------------------------
// MODALE INTERNE POUR CRÉER / METTRE À JOUR UN OWNER
// ---------------------------------------------------------
interface OwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ownerToEdit: Owner | null;
}

export const OwnerModal: React.FC<OwnerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ownerToEdit,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ownerToEdit) {
      setFullName(ownerToEdit.fullName || '');
      setEmail(ownerToEdit.email || '');
      setPhone(ownerToEdit.phone || '');
      setPassword('');
    } else {
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
    }
  }, [ownerToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (ownerToEdit) {
        await api.patch(`/admin/management/${ownerToEdit.id}`, {
          fullName,
          email,
          phone,
        });
      } else {
        await api.post('/admin/management', {
          fullName,
          email,
          phone,
          password,
        });
      }
      onSuccess();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de l'owner :", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md border border-slate-800 bg-slate-950 text-slate-100 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">
            {ownerToEdit ? 'Edit Owner' : 'Add New Owner'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-400">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full border border-slate-800 bg-slate-900 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-400">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-800 bg-slate-900 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-400">
              Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-slate-800 bg-slate-900 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          {!ownerToEdit && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-400">
                Temporary Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-slate-800 bg-slate-900 text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-800 hover:bg-slate-900 text-slate-300 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Owner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// COMPOSANT PRINCIPAL
// ---------------------------------------------------------
export const SuperAdminPage: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalOwners: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
  });
  const [owners, setOwners] = useState<Owner[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modale Owner
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);

  // Modale Subscription
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  // Filtres, recherches et thème
  const [ownerSearch, setOwnerSearch] = useState('');
  const [subSearchTerm, setSubSearchTerm] = useState('');
  const [subFilter, setSubFilter] = useState('ALL');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, ownersRes, invoicesRes, subsRes] = await Promise.all([
        api.get('/admin/management/stats'),
        api.get('/admin/management'),
        api.get('/admin/invoices'),
        api.get('/admin/subscriptions'),
      ]);
      setStats(statsRes.data);
      setOwners(ownersRes.data);
      setInvoices(invoicesRes.data.invoices);
      setSubscriptions(subsRes.data.subscriptions);
    } catch (err) {
      console.error("Erreur lors de la récupération des données :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('owner_token');
    navigate('/login');
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/admin/management/${id}/toggle-status`);
      fetchData();
    } catch (err) {
      console.error("Erreur lors du changement de statut :", err);
    }
  };

  const handleDeleteOwner = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet owner ?")) return;

    try {
      await api.delete(`/admin/management/${id}`);
      fetchData();
    } catch (err) {
      console.error("Erreur suppression owner :", err);
    }
  };

  const handleMarkInvoiceAsPaid = async (id: string) => {
    try {
      await api.patch(`/admin/invoices/${id}/pay`);
      fetchData();
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la facture :", err);
    }
  };

  const filteredOwners = owners.filter(
    (owner) =>
      owner.fullName.toLowerCase().includes(ownerSearch.toLowerCase()) ||
      owner.email.toLowerCase().includes(ownerSearch.toLowerCase())
  );

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const searchTerm = subSearchTerm.toLowerCase();
    const matchesSearch =
      sub.planName.toLowerCase().includes(searchTerm) ||
      (sub.owner?.email?.toLowerCase().includes(searchTerm) ?? false) ||
      (sub.owner
        ? `${sub.owner.firstName} ${sub.owner.lastName}`
            .toLowerCase()
            .includes(searchTerm)
        : false);
    const matchesFilter = subFilter === 'ALL' || sub.status === subFilter;

    return matchesSearch && matchesFilter;
  });

  const filteredInvoices = invoices.filter((inv) => {
    if (invoiceStatusFilter === 'ALL') return true;
    return inv.status === invoiceStatusFilter;
  });

  return (
    <div className={`min-h-screen flex flex-col relative transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Navbar */}
      <header className={`border-b px-6 py-4 flex justify-between items-center shadow-md transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center space-x-3">
          <span className="text-2xl">⚡</span>
          <h1 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            LocaCar <span className="text-purple-500 font-extrabold">Super Admin Center</span>
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>superadmin@locacar.com</span>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Changer de thème"
          >
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-red-600/20"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8">
        
        {/* Platform Overview Banner */}
        <div className={`border rounded-2xl p-6 shadow-xl space-y-2 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Platform Overview 📊
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Manage platform owners, monitor active subscriptions, and track overall financial billing across LocaCar.
          </p>
        </div>

        {/* Gestion des plans d'abonnement */}
        <SubscriptionPlansManagement isDarkMode={isDarkMode} />

        {/* Stats Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`border rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-4 hover:border-purple-500/50 transition-all duration-300 ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-start">
              <span className={`text-xs font-bold tracking-wider uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Platform Owners</span>
              <span className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl text-lg">👥</span>
            </div>
            <div>
              <div className={`text-4xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{loading ? '...' : stats.totalOwners}</div>
              <p className="text-xs text-purple-500 mt-1 font-medium">Manage registered owners & agencies</p>
            </div>
          </div>

          <div className={`border rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-all duration-300 ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-start">
              <span className={`text-xs font-bold tracking-wider uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Active Subscriptions</span>
              <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl text-lg">💳</span>
            </div>
            <div>
              <div className={`text-4xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{loading ? '...' : stats.activeSubscriptions}</div>
              <p className="text-xs text-blue-500 mt-1 font-medium">Monitor plans & renewals</p>
            </div>
          </div>

          <div className={`border rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition-all duration-300 ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-start">
              <span className={`text-xs font-bold tracking-wider uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Invoices & Billing</span>
              <span className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-lg">📄</span>
            </div>
            <div>
              <div className={`text-4xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {loading 
                  ? '...' 
                  : `$${invoices
                      .filter((inv) => inv.status === 'PAID')
                      .reduce((sum, inv) => sum + inv.amount, 0)
                      .toFixed(2)}`}
              </div>
              <p className="text-xs text-emerald-500 mt-1 font-medium">View system revenue & receipts</p>
            </div>
          </div>
        </div>

        {/* Recent Owners Management Section */}
        <div className={`border rounded-2xl p-6 shadow-lg space-y-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Recent Owners Management</h3>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search owner by name/email..."
                value={ownerSearch}
                onChange={(e) => setOwnerSearch(e.target.value)}
                className={`border px-4 py-2 rounded-xl text-sm focus:outline-none focus:border-purple-500 transition-all w-full md:w-64 ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 text-slate-200' 
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
              <button
                onClick={() => { setSelectedOwner(null); setIsModalOpen(true); }}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-purple-600/20 flex items-center space-x-2 whitespace-nowrap"
              >
                <span>+ Add New Owner</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Loading owners...</div>
          ) : filteredOwners.length === 0 ? (
            <div className={`border border-dashed rounded-xl p-8 text-center text-sm ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
              No owners found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-xs uppercase tracking-wider ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-sm ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  {filteredOwners.map((owner) => (
                    <tr key={owner.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}`}>
                      <td className={`py-3 px-4 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{owner.fullName}</td>
                      <td className={`py-3 px-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{owner.email}</td>
                      <td className={`py-3 px-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{owner.phone || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          owner.role === 'ROLE_SUPER_ADMIN' 
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {owner.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          owner.isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {owner.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => { setSelectedOwner(owner); setIsModalOpen(true); }}
                          className="text-blue-400 hover:text-blue-300 text-xs font-semibold px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(owner.id)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                            owner.isActive 
                              ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' 
                              : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                          }`}
                        >
                          {owner.isActive ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteOwner(owner.id)}
                          className="text-red-400 hover:text-red-300 text-xs font-semibold px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* --- SECTION : Subscriptions Management --- */}
        <div className={`border rounded-2xl p-6 shadow-lg space-y-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <span>💳 Subscriptions Management</span>
            </h3>

            <div className="relative w-full md:w-72">
              <Search className={`absolute left-3.5 top-3 w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Rechercher un abonnement..."
                value={subSearchTerm}
                onChange={(e) => setSubSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm border outline-none transition-all ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1">
              {['ALL', 'ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED'].map((status) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setSubFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    subFilter === status
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : isDarkMode
                        ? 'bg-slate-900 text-slate-400 hover:text-white'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Loading subscriptions...</div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className={`border border-dashed rounded-xl p-8 text-center text-sm ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
              Aucun abonnement ne correspond à votre recherche.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-xs uppercase tracking-wider ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Period End</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-sm ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  {filteredSubscriptions.map((sub) => (
                    <tr key={sub.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}`}>
                      <td className={`py-3 px-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {sub.owner ? `${sub.owner.firstName} ${sub.owner.lastName}` : 'N/A'}
                        <span className={`block text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{sub.owner?.email}</span>
                      </td>
                      <td className={`py-3 px-4 font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sub.planName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          sub.status === 'ACTIVE' 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubscription(sub);
                            setIsSubModalOpen(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-blue-600/20"
                        >
                          Manage Plan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* --- SECTION : Invoices & Subscriptions Billing --- */}
        <div className={`border rounded-2xl p-6 shadow-lg space-y-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <span>📄 Invoices & Subscriptions Billing</span>
            </h3>
            
            <div className={`flex items-center border p-1 rounded-xl text-xs font-semibold ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button
                onClick={() => setInvoiceStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  invoiceStatusFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-md'
                    : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setInvoiceStatusFilter('PAID')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  invoiceStatusFilter === 'PAID'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setInvoiceStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  invoiceStatusFilter === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-md'
                    : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending
              </button>
            </div>
          </div>

          {loading ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className={`border border-dashed rounded-xl p-8 text-center text-sm ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
              No invoices found for this status.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-xs uppercase tracking-wider ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Issued Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-sm ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'}`}>
                      <td className={`py-3 px-4 font-mono font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{inv.reference}</td>
                      <td className={`py-3 px-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {inv.owner ? `${inv.owner.firstName} ${inv.owner.lastName}` : 'N/A'}
                        <span className={`block text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{inv.owner?.email}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-400">${inv.amount.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          inv.status === 'PAID' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(inv.issuedAt).toLocaleDateString()}</td>
                      <td className={`py-3 px-4 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        {inv.status === 'PENDING' && (
                          <button
                            onClick={() => handleMarkInvoiceAsPaid(inv.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-emerald-600/20"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Modale d'administration des Owners */}
      <OwnerModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedOwner(null); }}
        onSuccess={() => {
          setIsModalOpen(false);
          setSelectedOwner(null);
          fetchData();
        }}
        ownerToEdit={selectedOwner}
      />

      {/* Modale d'administration des Abonnements (Manage Plan) */}
      <SubscriptionModal
        isOpen={isSubModalOpen}
        onClose={() => { setIsSubModalOpen(false); setSelectedSubscription(null); }}
        onSuccess={() => {
          setIsSubModalOpen(false);
          setSelectedSubscription(null);
          fetchData();
        }}
        subscription={selectedSubscription}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
