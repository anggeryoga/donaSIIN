import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Heart, Eye, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TimelineActivity {
  id: string;
  title: string;
  description: string;
  location: string;
  activity_date: string;
  image_urls: string[];
  participant_count?: number;
  created_at: string;
}

export default function Timeline() {
  const [activities, setActivities] = useState<TimelineActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'recent' | 'month'>('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('timeline_activities')
        .select('*')
        .order('activity_date', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const activityDate = new Date(activity.activity_date);
    const now = new Date();
    
    switch (filter) {
      case 'recent':
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return activityDate >= sevenDaysAgo;
      case 'month':
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return activityDate >= thirtyDaysAgo;
      default:
        return true;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getImageUrl = (imagePath: string) => {
    return supabase.storage.from('timeline-images').getPublicUrl(imagePath).data.publicUrl;
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Dokumentasi Kegiatan</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Timeline lengkap kegiatan Jumat Berkah dan program sosial lainnya. 
            Lihat bagaimana donasi Anda memberikan dampak nyata.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                filter === 'all'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semua Kegiatan
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                filter === 'recent'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => setFilter('month')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                filter === 'month'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              30 Hari Terakhir
            </button>
          </div>
        </div>

        {/* Timeline */}
        {filteredActivities.length > 0 ? (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300 hidden md:block"></div>

            <div className="space-y-8">
              {filteredActivities.map((activity, index) => (
                <div key={activity.id} className="relative animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  {/* Timeline Dot */}
                  <div className="absolute left-6 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg hidden md:block"></div>

                  {/* Content Card */}
                  <div className="md:ml-16 card">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Images */}
                      {activity.image_urls && activity.image_urls.length > 0 && (
                        <div className="lg:w-1/3">
                          <div className="grid grid-cols-2 gap-2">
                            {activity.image_urls.slice(0, 4).map((imageUrl, imgIndex) => (
                              <div key={imgIndex} className="relative group cursor-pointer">
                                <img
                                  src={getImageUrl(imageUrl)}
                                  alt={`${activity.title} - ${imgIndex + 1}`}
                                  className="w-full h-24 object-cover rounded-lg transition-transform group-hover:scale-105"
                                  onClick={() => setSelectedImage(getImageUrl(imageUrl))}
                                />
                                {imgIndex === 3 && activity.image_urls.length > 4 && (
                                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-semibold">
                                      +{activity.image_urls.length - 4}
                                    </span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                                  <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {activity.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDate(activity.activity_date)}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {activity.location}
                              </div>
                              {activity.participant_count && (
                                <div className="flex items-center">
                                  <Users className="w-4 h-4 mr-1" />
                                  {activity.participant_count} orang
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="bg-blue-100 p-2 rounded-full">
                            <Heart className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>

                        <p className="text-gray-700 leading-relaxed">
                          {activity.description}
                        </p>

                        {activity.image_urls && activity.image_urls.length > 4 && (
                          <button
                            onClick={() => setSelectedImage(getImageUrl(activity.image_urls[0]))}
                            className="mt-4 text-blue-600 hover:text-blue-800 font-medium flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Lihat semua foto ({activity.image_urls.length})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Belum Ada Kegiatan
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Belum ada dokumentasi kegiatan yang tersedia.'
                : `Tidak ada kegiatan dalam ${filter === 'recent' ? '7 hari' : '30 hari'} terakhir.`
              }
            </p>
          </div>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
            <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
                <img
                  src={selectedImage}
                  alt="Dokumentasi kegiatan"
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ingin Ikut Berkontribusi?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Setiap donasi Anda membantu mewujudkan kegiatan-kegiatan sosial seperti ini. 
              Mari bersama-sama berbagi kebahagiaan untuk sesama.
            </p>
            <button className="btn-primary">
              <Heart className="w-5 h-5 mr-2" />
              Mulai Berdonasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}