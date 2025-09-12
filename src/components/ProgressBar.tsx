import React, { useState, useEffect } from 'react';
import { Target, Calendar, Users, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WeeklyProgress {
  week_start: string;
  week_end: string;
  target_amount: number;
  current_amount: number;
  donor_count: number;
  percentage: number;
}

export default function ProgressBar() {
  const [currentWeek, setCurrentWeek] = useState<WeeklyProgress | null>(null);
  const [recentWeeks, setRecentWeeks] = useState<WeeklyProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyProgress();
  }, []);

  const fetchWeeklyProgress = async () => {
    setLoading(true);
    try {
      // Get current week's Friday (Jumat Berkah)
      const today = new Date();
      const currentFriday = getNextFriday(today);
      const weekStart = new Date(currentFriday);
      weekStart.setDate(weekStart.getDate() - 6); // Monday of current week

      // Fetch current week's target
      const { data: targetData } = await supabase
        .from('weekly_targets')
        .select('*')
        .eq('week_start', weekStart.toISOString().split('T')[0]);

      // Fetch current week's donations
      const { data: donationsData } = await supabase
        .from('donations')
        .select('amount, donor_name')
        .eq('status', 'success')
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', currentFriday.toISOString());

      const currentAmount = donationsData?.reduce((sum, d) => sum + d.amount, 0) || 0;
      const donorCount = new Set(donationsData?.map(d => d.donor_name)).size;
      const targetAmount = targetData && targetData.length > 0 ? targetData[0].target_amount : 1000000; // Default 1M
      const percentage = Math.min((currentAmount / targetAmount) * 100, 100);

      setCurrentWeek({
        week_start: weekStart.toISOString().split('T')[0],
        week_end: currentFriday.toISOString().split('T')[0],
        target_amount: targetAmount,
        current_amount: currentAmount,
        donor_count: donorCount,
        percentage
      });

      // Fetch recent weeks for history - separate queries to avoid foreign key issues
      const { data: recentData } = await supabase
        .from('weekly_targets')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(4);

      // Fetch all donations for recent weeks
      const recentWeeksData: WeeklyProgress[] = [];
      
      if (recentData && recentData.length > 0) {
        for (const week of recentData) {
          const weekStartDate = new Date(week.week_start + 'T00:00:00.000Z');
          const weekEndDate = new Date(week.week_end + 'T23:59:59.999Z');
          
          const { data: weekDonations } = await supabase
            .from('donations')
            .select('amount, donor_name')
            .eq('status', 'success')
            .gte('created_at', weekStartDate.toISOString())
            .lte('created_at', weekEndDate.toISOString());
          
          const amount = weekDonations?.reduce((sum, d) => sum + d.amount, 0) || 0;
          const donors = new Set(weekDonations?.map(d => d.donor_name)).size;
          
          recentWeeksData.push({
            week_start: week.week_start,
            week_end: week.week_end,
            target_amount: week.target_amount,
            current_amount: amount,
            donor_count: donors,
            percentage: Math.min((amount / week.target_amount) * 100, 100)
          });
        }
      }

      setRecentWeeks(recentWeeksData);
    } catch (error) {
      console.error('Error fetching weekly progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextFriday = (date: Date) => {
    const result = new Date(date);
    const day = result.getDay();
    const daysUntilFriday = (5 - day + 7) % 7;
    result.setDate(result.getDate() + daysUntilFriday);
    return result;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Week Progress */}
      {currentWeek && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Progress Jumat Berkah Minggu Ini
              </h3>
              <p className="text-gray-600">
                {formatDate(currentWeek.week_start)} - {formatDate(currentWeek.week_end)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {currentWeek.percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Tercapai</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${currentWeek.percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Rp {currentWeek.current_amount.toLocaleString('id-ID')}</span>
              <span>Target: Rp {currentWeek.target_amount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    Rp {(currentWeek.target_amount - currentWeek.current_amount).toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-gray-600">Sisa Target</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {currentWeek.donor_count}
                  </div>
                  <div className="text-sm text-gray-600">Donatur Minggu Ini</div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    Rp {currentWeek.donor_count > 0 ? Math.round(currentWeek.current_amount / currentWeek.donor_count).toLocaleString('id-ID') : '0'}
                  </div>
                  <div className="text-sm text-gray-600">Rata-rata Donasi</div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          {currentWeek.percentage < 100 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-1">
                    Mari Capai Target Bersama!
                  </h4>
                  <p className="text-yellow-700 text-sm">
                    Masih butuh Rp {(currentWeek.target_amount - currentWeek.current_amount).toLocaleString('id-ID')} 
                    lagi untuk mencapai target Jumat Berkah minggu ini.
                  </p>
                </div>
                <button className="btn-primary">
                  Donasi Sekarang
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Weeks History */}
      {recentWeeks.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-blue-600" />
            Riwayat Minggu Sebelumnya
          </h3>

          <div className="space-y-4">
            {recentWeeks.map((week, index) => (
              <div key={week.week_start} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {formatDate(week.week_start)} - {formatDate(week.week_end)}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {week.donor_count} donatur • Rp {week.current_amount.toLocaleString('id-ID')} terkumpul
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      week.percentage >= 100 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {week.percentage.toFixed(1)}%
                    </div>
                    {week.percentage >= 100 && (
                      <div className="text-xs text-green-600 font-medium">✓ Target Tercapai</div>
                    )}
                  </div>
                </div>

                <div className="progress-bar">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${
                      week.percentage >= 100 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : 'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}
                    style={{ width: `${Math.min(week.percentage, 100)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Rp {week.current_amount.toLocaleString('id-ID')}</span>
                  <span>Target: Rp {week.target_amount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}