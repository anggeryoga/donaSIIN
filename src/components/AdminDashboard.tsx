import { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Donation {
  id: string;
  donor_name: string;
  phone_number: string;
  amount: number;
  status: 'pending' | 'success' | 'rejected';
  payment_proof_url?: string;
  created_at: string;
}

interface DashboardStats {
  total_donations: number;
  pending_donations: number;
  total_amount: number;
  total_donors: number;
}

export default function AdminDashboard() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_donations: 0,
    pending_donations: 0,
    total_amount: 0,
    total_donors: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'expenses' | 'timeline'>('pending');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch donations
      const { data: donationsData, error: donationsError } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (donationsError) throw donationsError;

      setDonations(donationsData || []);

      // Calculate stats
      const totalDonations = donationsData?.length || 0;
      const pendingDonations = donationsData?.filter(d => d.status === 'pending').length || 0;
      const successfulDonations = donationsData?.filter(d => d.status === 'success') || [];
      const totalAmount = successfulDonations.reduce((sum, d) => sum + d.amount, 0);
      const uniqueDonors = new Set(successfulDonations.map(d => d.phone_number)).size;

      setStats({
        total_donations: totalDonations,
        pending_donations: pendingDonations,
        total_amount: totalAmount,
        total_donors: uniqueDonors
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDonationStatus = async (donationId: string, status: 'success' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('donations')
        .update({ 
          status,
          verified_at: new Date().toISOString()
        })
        .eq('id', donationId);

      if (error) throw error;

      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating donation status:', error);
    }
  };

  const getPaymentProofUrl = (filename: string) => {
    return supabase.storage.from('payment-proofs').getPublicUrl(filename).data.publicUrl;
  };

  const pendingDonations = donations.filter(d => d.status === 'pending');
  const allDonations = donations;

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Admin</h1>
          <p className="text-gray-600">Kelola donasi dan konten website donaSIIN</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.total_donations}
            </h3>
            <p className="text-gray-600">Total Donasi</p>
          </div>

          <div className="card text-center">
            <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.pending_donations}
            </h3>
            <p className="text-gray-600">Menunggu Verifikasi</p>
          </div>

          <div className="card text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              Rp {stats.total_amount.toLocaleString('id-ID')}
            </h3>
            <p className="text-gray-600">Total Terkumpul</p>
          </div>

          <div className="card text-center">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.total_donors}
            </h3>
            <p className="text-gray-600">Donatur Unik</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Verifikasi Donasi ({pendingDonations.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Semua Donasi ({allDonations.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingDonations.length > 0 ? (
              pendingDonations.map((donation) => (
                <div key={donation.id} className="card">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {donation.donor_name}
                        </h3>
                        <span className="status-pending">Pending</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Nomor HP:</span> {donation.phone_number}
                        </div>
                        <div>
                          <span className="font-medium">Jumlah:</span> 
                          <span className="text-green-600 font-semibold ml-1">
                            Rp {donation.amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Tanggal:</span> 
                          {new Date(donation.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {donation.payment_proof_url && (
                        <button
                          onClick={() => setSelectedProof(getPaymentProofUrl(donation.payment_proof_url!))}
                          className="btn-secondary flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat Bukti
                        </button>
                      )}
                      
                      <button
                        onClick={() => updateDonationStatus(donation.id, 'success')}
                        className="btn-success flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </button>
                      
                      <button
                        onClick={() => updateDonationStatus(donation.id, 'rejected')}
                        className="btn-danger flex items-center"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Semua Donasi Sudah Diverifikasi
                </h3>
                <p className="text-gray-600">
                  Tidak ada donasi yang menunggu verifikasi saat ini.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'all' && (
          <div className="card p-0">
            <div className="table-responsive">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="table-header">
                  <tr>
                    <th className="px-6 py-3 text-left">Tanggal</th>
                    <th className="px-6 py-3 text-left">Nama</th>
                    <th className="px-6 py-3 text-left">Nomor HP</th>
                    <th className="px-6 py-3 text-left">Jumlah</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allDonations.map((donation) => (
                    <tr key={donation.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        {new Date(donation.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="table-cell font-medium">
                        {donation.donor_name}
                      </td>
                      <td className="table-cell">
                        {donation.phone_number}
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
                      <td className="table-cell">
                        {donation.payment_proof_url && (
                          <button
                            onClick={() => setSelectedProof(getPaymentProofUrl(donation.payment_proof_url!))}
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Lihat
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Proof Modal */}
        {selectedProof && (
          <div className="modal-overlay" onClick={() => setSelectedProof(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Bukti Transfer</h3>
                  <button
                    onClick={() => setSelectedProof(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <img
                  src={selectedProof}
                  alt="Bukti transfer"
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