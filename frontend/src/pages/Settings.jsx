import React, { useState, useEffect } from 'react';
import { User, Phone, Briefcase, DollarSign, Save, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const Settings = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    employment: 'Salaried',
    income: '',
    expenses: ''
  });
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('chitx_user') || '{}');
    if (userData.walletAddress) {
      setWalletAddress(userData.walletAddress);
      setFormData({
        name: userData.name || '',
        phone: userData.phone || '',
        employment: userData.employment || 'Salaried',
        income: userData.income || '',
        expenses: userData.expenses || ''
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleEmployment = (type) => {
    setFormData((prev) => ({ ...prev, employment: type }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put('http://localhost:5000/api/auth/profile', {
        walletAddress,
        ...formData
      });

      // Update LocalStorage
      const userData = JSON.parse(localStorage.getItem('chitx_user') || '{}');
      const updatedUser = {
        ...userData,
         name: formData.name,
         phone: formData.phone,
         employment: formData.employment,
         income: Number(formData.income),
         expenses: Number(formData.expenses),
      };
      localStorage.setItem('chitx_user', JSON.stringify(updatedUser));

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Settings</h2>
        <p className="text-slate-500 font-medium mt-2">Manage your personal and numerical profile information.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-bold text-slate-400 mb-1.5 block uppercase tracking-widest">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-slate-700 font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-400 mb-1.5 block uppercase tracking-widest">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="tel"
                  placeholder="+91 9876543210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-slate-700 font-bold"
                  required
                />
              </div>
            </div>
          </div>

          <div>
             <label className="text-sm font-bold text-slate-400 mb-1.5 block uppercase tracking-widest">Employment Type</label>
             <div className="flex flex-wrap gap-3">
                 {['Student', 'Salaried', 'Business'].map((type) => (
                     <button
                       key={type}
                       type="button"
                       onClick={() => handleToggleEmployment(type)}
                       className={`py-2 px-5 rounded-xl border text-sm font-bold transition-all ${
                         formData.employment === type
                           ? 'bg-teal-50 border-teal-500 text-teal-600'
                           : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
                       }`}
                     >
                       {type}
                     </button>
                 ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-bold text-slate-400 mb-1.5 block uppercase tracking-widest">Monthly Income ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  name="income"
                  value={formData.income}
                  onChange={handleChange}
                  type="number"
                  placeholder="50000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-slate-700 font-bold"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-bold text-slate-400 mb-1.5 block uppercase tracking-widest">Monthly Expenses ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  name="expenses"
                  value={formData.expenses}
                  onChange={handleChange}
                  type="number"
                  placeholder="20000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-slate-700 font-bold"
                />
              </div>
            </div>
          </div>

          {error && <div className="p-4 bg-red-50 text-red-500 rounded-xl text-sm font-bold border border-red-100">{error}</div>}
          {success && (
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold border border-emerald-100 flex items-center gap-2">
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
             <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
             >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {loading ? 'Saving...' : 'Save Changes'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
