import React, { useState, useRef } from 'react';
import { Heart, Upload, QrCode, CheckCircle, AlertCircle, Phone, User, DollarSign } from 'lucide-react';
import QRCode from 'qrcode';
import { supabase } from '../lib/supabase';
import { generateQRIS } from '../utils/qris';

interface DonationData {
  donor_name: string;
  phone_number: string;
  amount: number;
  payment_proof?: File;
}

export default function DonationForm() {
  const [formData, setFormData] = useState<DonationData>({
    donor_name: '',
    phone_number: '',
    amount: 0
  });
  const [qrisData, setQrisData] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: QRIS, 3: Upload Proof, 4: Success
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presetAmounts = [10000, 25000, 50000, 100000, 250000, 500000];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseInt(value) || 0 : value
    }));
  };

  const handleAmountSelect = (amount: number) => {
    setFormData(prev => ({ ...prev, amount }));
  };

  const generateQRCode = async () => {
    if (!formData.donor_name || !formData.phone_number || !formData.amount) {
      setMessage({ type: 'error', text: 'Mohon lengkapi semua data terlebih dahulu' });
      return;
    }

    if (formData.amount < 1000) {
      setMessage({ type: 'error', text: 'Minimal donasi adalah Rp 1.000' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Generate QRIS string
      const qrisString = generateQRIS(formData.amount);
      setQrisData(qrisString);

      // Generate QR Code image
      const qrCodeDataUrl = await QRCode.toDataURL(qrisString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1E293B',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrCodeDataUrl);
      setStep(2);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setMessage({ type: 'error', text: 'Gagal membuat QR code. Silakan coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'File harus berupa gambar (JPG, PNG, dll)' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Ukuran file maksimal 5MB' });
        return;
      }

      setPaymentProof(file);
      setMessage(null);
    }
  };

  const submitDonation = async () => {
    if (!paymentProof) {
      setMessage({ type: 'error', text: 'Mohon upload bukti transfer terlebih dahulu' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Upload payment proof
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, paymentProof);

      if (uploadError) throw uploadError;

      // Insert donation record
      const { error: insertError } = await supabase
        .from('donations')
        .insert({
          donor_name: formData.donor_name,
          phone_number: formData.phone_number,
          amount: formData.amount,
          payment_proof_url: fileName,
          status: 'pending',
          qris_data: qrisData
        });

      if (insertError) throw insertError;

      setStep(4);
      setMessage({ type: 'success', text: 'Donasi berhasil dikirim! Menunggu verifikasi admin.' });
    } catch (error) {
      console.error('Error submitting donation:', error);
      setMessage({ type: 'error', text: 'Gagal mengirim donasi. Silakan coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ donor_name: '', phone_number: '', amount: 0 });
    setQrisData('');
    setQrCodeUrl('');
    setPaymentProof(null);
    setStep(1);
    setMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="section-padding">
      <div className="container max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Form Donasi</h1>
          <p className="text-xl text-gray-600">
            Ikuti langkah-langkah berikut untuk menyelesaikan donasi Anda
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= stepNum 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-12 h-1 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="card">
          {/* Step 1: Form Data */}
          {step === 1 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <User className="w-6 h-6 mr-2 text-blue-600" />
                Data Donatur
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    name="donor_name"
                    value={formData.donor_name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Masukkan nama lengkap Anda"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nomor WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="input-field pl-12"
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah Donasi *
                  </label>
                  
                  {/* Preset Amounts */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {presetAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleAmountSelect(amount)}
                        className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                          formData.amount === amount
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        Rp {amount.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount || ''}
                      onChange={handleInputChange}
                      className="input-field pl-12"
                      placeholder="Atau masukkan jumlah custom"
                      min="1000"
                      step="1000"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Minimal donasi Rp 1.000</p>
                </div>

                <button
                  onClick={generateQRCode}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {loading ? (
                    <div className="loading-spinner mr-2"></div>
                  ) : (
                    <QrCode className="w-5 h-5 mr-2" />
                  )}
                  Generate QRIS
                </button>
              </div>
            </div>
          )}

          {/* Step 2: QRIS Display */}
          {step === 2 && (
            <div className="animate-slide-up text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center justify-center">
                <QrCode className="w-6 h-6 mr-2 text-blue-600" />
                Scan QRIS untuk Pembayaran
              </h2>

              <div className="bg-white p-8 rounded-xl border-2 border-gray-200 mb-6">
                {qrCodeUrl && (
                  <img 
                    src={qrCodeUrl} 
                    alt="QRIS Code" 
                    className="mx-auto mb-4"
                  />
                )}
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  Rp {formData.amount.toLocaleString('id-ID')}
                </div>
                <div className="text-gray-600">
                  <p>Donatur: {formData.donor_name}</p>
                  <p>WhatsApp: {formData.phone_number}</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Petunjuk Pembayaran:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Buka aplikasi mobile banking atau e-wallet Anda</li>
                      <li>Pilih menu "Scan QR" atau "QRIS"</li>
                      <li>Scan QR code di atas</li>
                      <li>Pastikan nominal sesuai dengan yang tertera</li>
                      <li>Lakukan pembayaran</li>
                      <li>Screenshot bukti pembayaran</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1"
                >
                  Kembali
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="btn-primary flex-1"
                >
                  Sudah Bayar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Upload Proof */}
          {step === 3 && (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Upload className="w-6 h-6 mr-2 text-blue-600" />
                Upload Bukti Transfer
              </h2>

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Upload bukti transfer yang jelas:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Screenshot dari aplikasi banking/e-wallet</li>
                        <li>Pastikan nominal dan waktu transaksi terlihat</li>
                        <li>Format: JPG, PNG (maksimal 5MB)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bukti Transfer *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      {paymentProof ? paymentProof.name : 'Klik untuk upload bukti transfer'}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary"
                    >
                      Pilih File
                    </button>
                  </div>
                </div>

                {paymentProof && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">
                        File berhasil dipilih: {paymentProof.name}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep(2)}
                    className="btn-secondary flex-1"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={submitDonation}
                    disabled={loading || !paymentProof}
                    className="btn-success flex-1 flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="loading-spinner mr-2"></div>
                    ) : (
                      <CheckCircle className="w-5 h-5 mr-2" />
                    )}
                    Kirim Donasi
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="animate-bounce-in text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Donasi Berhasil Dikirim!
              </h2>
              
              <p className="text-lg text-gray-600 mb-6">
                Terima kasih atas donasi Anda sebesar <strong>Rp {formData.amount.toLocaleString('id-ID')}</strong>.
                Donasi Anda sedang dalam proses verifikasi oleh admin.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  <strong>Status:</strong> Menunggu Verifikasi<br />
                  <strong>Estimasi:</strong> 1-24 jam<br />
                  <strong>Kontak:</strong> Jika ada pertanyaan, hubungi admin melalui WhatsApp
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={resetForm}
                  className="btn-primary flex-1"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Donasi Lagi
                </button>
                <button
                  onClick={() => window.open('https://wa.me/6282324159922', '_blank')}
                  className="btn-secondary flex-1"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Hubungi Admin
                </button>
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                <span>{message.text}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}