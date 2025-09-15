import { useState, useEffect } from 'react';
import { Search, Download, Eye, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Donation {
  id: string;
  donor_name: string;
  phone_number: string;
  amount: number;
  status: 'pending' | 'success' | 'rejected';
  created_at: string;
  verified_at?: string;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  location: string;
  receipt_url?: string;
  created_at: string;
}

interface Summary {
  total_income: number;
  total_expense: number;
  balance: number;
  total_donors: number;
}

export default function TransparencyTable() {
  const [activeTab, setActiveTab] = useState<'donations' | 'expenses'>('donations');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_income: 0,
    total_expense: 0,
    balance: 0,
    total_donors: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch successful donations only for public view
      const { data: donationsData, error: donationsError } = await supabase
        .from('donations')
        .select('*')
        .eq('status', 'success')
        .order('created_at', { ascending: false });

      if (donationsError) throw donationsError;

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (expensesError) throw expensesError;

      setDonations(donationsData || []);
      setExpenses(expensesData || []);

      // Calculate summary
      const totalIncome = donationsData?.reduce((sum, d) => sum + d.amount, 0) || 0;
      const totalExpense = expensesData?.reduce((sum, e) => sum + e.amount, 0) || 0;
      const uniqueDonors = new Set(donationsData?.map(d => d.phone_number)).size;

      setSummary({
        total_income: totalIncome,
        total_expense: totalExpense,
        balance: totalIncome - totalExpense,
        total_donors: uniqueDonors
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const maskPhoneNumber = (phone: string) => {
    if (phone.length < 4) return phone;
    const start = phone.substring(0, 2);
    const end = phone.substring(phone.length - 3);
    const middle = 'x'.repeat(phone.length - 5);
    return `${start}${middle}${end}`;
  };

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = donation.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.phone_number.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || donation.status === statusFilter;
    const matchesDate = dateFilter === 'all' || 
                       (dateFilter === 'today' && new Date(donation.created_at).toDateString() === new Date().toDateString()) ||
                       (dateFilter === 'week' && new Date(donation.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
                       (dateFilter === 'month' && new Date(donation.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = dateFilter === 'all' || 
                       (dateFilter === 'today' && new Date(expense.created_at).toDateString() === new Date().toDateString()) ||
                       (dateFilter === 'week' && new Date(expense.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
                       (dateFilter === 'month' && new Date(expense.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesDate;
  });

  const exportData = () => {
    const data = activeTab === 'donations' ? filteredDonations : filteredExpenses;
    const headers = activeTab === 'donations' 
      ? ['Tanggal', 'Nama Donatur', 'Nomor HP', 'Jumlah', 'Status']
      : ['Tanggal', 'Deskripsi', 'Lokasi', 'Jumlah'];
    
    const csvContent = [
      headers.join(','),
      ...data.map(item => {
        if (activeTab === 'donations') {
          const donation = item as Donation;
          return [
            new Date(donation.created_at).toLocaleDateString('id-ID'),
            donation.donor_name,
            maskPhoneNumber(donation.phone_number),
            donation.amount,
            donation.status
          ].join(',');
        } else {
          const expense = item as Expense;
          return [
            new Date(expense.created_at).toLocaleDateString('id-ID'),
            expense.description,
            expense.location,
            expense.amount
          ].join(',');
        }
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="section-padding">
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding">
      <div className="container">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Transparansi Keuangan</h1>
          <p className="text-xl text-gray-600">
            Laporan keuangan lengkap dan transparan untuk semua donasi dan pengeluaran
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Rp {summary.total_income.toLocaleString('id-ID')}
            </h3>
            <p className="text-gray-600">Total Pemasukan</p>
          </div>

          <div className="card text-center">
            <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Rp {summary.total_expense.toLocaleString('id-ID')}
            </h3>
            <p className="text-gray-600">Total Pengeluaran</p>
          </div>

          <div className="card text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className={`text-2xl font-bold mb-1 ${
              summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              Rp {summary.balance.toLocaleString('id-ID')}
            </h3>
            <p className="text-gray-600">Saldo</p>
          </div>

          <div className="card text-center">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {summary.total_donors}
            </h3>
            <p className="text-gray-600">Total Donatur</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('donations')}
            className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${
              activeTab === 'donations'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pemasukan ({donations.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${
              activeTab === 'expenses'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pengeluaran ({expenses.length})
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari nama, nomor HP, atau deskripsi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-12"
                />
              </div>
            </div>

            {activeTab === 'donations' && (
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field"
                >
                  <option value="all">Semua Status</option>
                  <option value="success">Berhasil</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
            )}

            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">Semua Waktu</option>
                <option value="today">Hari Ini</option>
                <option value="week">7 Hari Terakhir</option>
                <option value="month">30 Hari Terakhir</option>
              </select>
            </div>

            <button
              onClick={exportData}
              className="btn-secondary flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card p-0">
          <div className="table-responsive">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left">Tanggal</th>
                  {activeTab === 'donations' ? (
                    <>
                      <th className="px-6 py-3 text-left">Nama Donatur</th>
                      <th className="px-6 py-3 text-left">Nomor HP</th>
                      <th className="px-6 py-3 text-left">Jumlah</th>
                      <th className="px-6 py-3 text-left">Status</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3 text-left">Deskripsi</th>
                      <th className="px-6 py-3 text-left">Lokasi</th>
                      <th className="px-6 py-3 text-left">Jumlah</th>
                      <th className="px-6 py-3 text-left">Bukti</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeTab === 'donations' ? (
                  filteredDonations.length > 0 ? (
                    filteredDonations.map((donation) => (
                      <tr key={donation.id} className="hover:bg-gray-50">
                        <td className="table-cell">
                          {new Date(donation.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="table-cell font-medium">
                          {donation.donor_name}
                        </td>
                        <td className="table-cell">
                          {maskPhoneNumber(donation.phone_number)}
                        </td>
                        <td className="table-cell font-semibold text-green-600">
                          Rp {donation.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="table-cell">
                          <span className={`status-${donation.status}`}>
                            {donation.status === 'success' ? 'Berhasil' :
                             donation.status === 'pending' ? 'Pending' : 'Ditolak'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="table-cell text-center text-gray-500 py-8">
                        Tidak ada data donasi yang ditemukan
                      </td>
                    </tr>
                  )
                ) : (
                  filteredExpenses.length > 0 ? (
                    filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="table-cell">
                          {new Date(expense.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="table-cell">
                          {expense.description}
                        </td>
                        <td className="table-cell">
                          {expense.location}
                        </td>
                        <td className="table-cell font-semibold text-red-600">
                          Rp {expense.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="table-cell">
                          {expense.receipt_url ? (
                            <button
                              onClick={() => setSelectedReceipt(expense.receipt_url!)}
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Lihat
                            </button>
                          ) : (
                            <span className="text-gray-400">Tidak ada</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="table-cell text-center text-gray-500 py-8">
                        Tidak ada data pengeluaran yang ditemukan
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Receipt Modal */}
        {selectedReceipt && (
          <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Bukti Pengeluaran</h3>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <img
                  src={`${supabase.storage.from('receipts').getPublicUrl(selectedReceipt).data.publicUrl}`}
                  alt="Bukti pengeluaran"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}