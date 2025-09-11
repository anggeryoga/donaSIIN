import { useState, useEffect } from 'react';
import { Heart, Users, TrendingUp, Calendar, Shield, Award } from 'lucide-react';
import DonationForm from './components/DonationForm';
import TransparencyTable from './components/TransparencyTable';
import ProgressBar from './components/ProgressBar';
import Timeline from './components/Timeline';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';

type User = {
  id: string;
  email: string;
  role?: string;
};

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const { session } = data;
      setUser(session?.user as User || null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      setUser(session?.user as User || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveTab('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="flex items-center justify-between py-4">
            <div className="navbar-brand flex items-center space-x-3">
              <Heart className="h-8 w-8 text-red-500" />
              <span className="text-gradient">donaSIIN</span>
              <span className="text-sm text-gray-500 font-normal">by SIINMEDIA</span>
            </div>
            
            <div className="navbar-nav">
              <button
                onClick={() => setActiveTab('home')}
                className={`navbar-link ${activeTab === 'home' ? 'active' : ''}`}
              >
                Beranda
              </button>
              <button
                onClick={() => setActiveTab('donate')}
                className={`navbar-link ${activeTab === 'donate' ? 'active' : ''}`}
              >
                Donasi
              </button>
              <button
                onClick={() => setActiveTab('transparency')}
                className={`navbar-link ${activeTab === 'transparency' ? 'active' : ''}`}
              >
                Transparansi
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`navbar-link ${activeTab === 'timeline' ? 'active' : ''}`}
              >
                Dokumentasi
              </button>
              
              {user ? (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`navbar-link ${activeTab === 'admin' ? 'active' : ''}`}
                  >
                    Admin Panel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('login')}
                  className={`navbar-link ${activeTab === 'login' ? 'active' : ''}`}
                >
                  Admin Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main>
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'donate' && <DonationForm />}
        {activeTab === 'transparency' && <TransparencyTable />}
        {activeTab === 'timeline' && <Timeline />}
        {activeTab === 'login' && !user && <AdminLogin onSuccess={() => setActiveTab('admin')} />}
        {activeTab === 'admin' && user && <AdminDashboard />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white section-padding">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Heart className="h-6 w-6 text-red-500" />
                <span className="text-xl font-bold">donaSIIN</span>
              </div>
              <p className="text-gray-400">
                Platform donasi transparan untuk membantu masyarakat yang membutuhkan.
                Setiap donasi tercatat dan dapat diverifikasi secara publik.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Kontak</h3>
              <div className="space-y-2 text-gray-400">
                <p>Email: info@siinmedia.com</p>
                <p>WhatsApp: +62 823-2415-9922</p>
                <p>Alamat: Jepara, Jawa Tengah</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Transparansi</h3>
              <div className="space-y-2 text-gray-400">
                <p>✓ Semua donasi tercatat publik</p>
                <p>✓ Bukti transfer diverifikasi</p>
                <p>✓ Laporan keuangan terbuka</p>
                <p>✓ Dokumentasi kegiatan lengkap</p>
              </div>
            </div>
          </div>
          
          <div className="divider"></div>
          
          <div className="text-center text-gray-400">
            <p>&copy; 2025 donaSIIN by SIINMEDIA. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HomePage() {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container text-center">
          <div className="animate-slide-up">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Berbagi Kebahagiaan
              <span className="block text-yellow-300">Untuk Sesama</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Platform donasi transparan untuk program Jumat Berkah dan kegiatan sosial lainnya.
              Setiap rupiah tercatat dan dapat diverifikasi secara publik.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary text-lg px-8 py-4">
                <Heart className="w-5 h-5 mr-2" />
                Mulai Berdonasi
              </button>
              <button className="btn-secondary bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4">
                <Shield className="w-5 h-5 mr-2" />
                Lihat Transparansi
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center animate-bounce-in">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">1,234</h3>
              <p className="text-gray-600">Total Donatur</p>
            </div>
            
            <div className="text-center animate-bounce-in" style={{ animationDelay: '0.1s' }}>
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Rp 45.6M</h3>
              <p className="text-gray-600">Dana Terkumpul</p>
            </div>
            
            <div className="text-center animate-bounce-in" style={{ animationDelay: '0.2s' }}>
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">2,567</h3>
              <p className="text-gray-600">Orang Terbantu</p>
            </div>
            
            <div className="text-center animate-bounce-in" style={{ animationDelay: '0.3s' }}>
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">156</h3>
              <p className="text-gray-600">Kegiatan Selesai</p>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Section */}
      <section className="section-padding">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Progress Jumat Berkah</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Pantau perkembangan pengumpulan dana untuk program Jumat Berkah mingguan
            </p>
          </div>
          <ProgressBar />
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Mengapa Pilih donaSIIN?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Platform donasi yang mengutamakan transparansi dan akuntabilitas
            </p>
          </div>
          
          <div className="grid-responsive">
            <div className="card text-center animate-slide-up">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">100% Transparan</h3>
              <p className="text-gray-600">
                Semua donasi dan pengeluaran tercatat secara publik. 
                Anda dapat memverifikasi setiap transaksi kapan saja.
              </p>
            </div>
            
            <div className="card text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Terverifikasi</h3>
              <p className="text-gray-600">
                Setiap donasi diverifikasi oleh admin dengan bukti transfer yang valid
                sebelum masuk ke dana program.
              </p>
            </div>
            
            <div className="card text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Dampak Nyata</h3>
              <p className="text-gray-600">
                Dokumentasi lengkap setiap kegiatan dengan foto dan video
                untuk memastikan donasi sampai ke yang membutuhkan.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;