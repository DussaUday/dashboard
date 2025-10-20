import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, Image, Award, Users, Settings, Plus, Trash2, Eye, 
  Globe, User, Cloud, LogOut, RefreshCw, Edit, Save 
} from 'lucide-react';
import axios from 'axios';
import { uploadToCloudinary } from '../config/cloudinary.js';
import AdminLogin from './AdminLogin';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [heroData, setHeroData] = useState({});
  const [services, setServices] = useState([]);
  const [awards, setAwards] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [aboutData, setAboutData] = useState({});
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  const checkAuthentication = () => {
    const auth = localStorage.getItem('adminAuth');
    const token = localStorage.getItem('adminToken');
    
    if (auth === 'authenticated' && token === 'admin-auth-token') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setAuthChecked(true);
  };

  const handleLogin = (success) => {
    setIsAuthenticated(success);
    if (success) {
      fetchAllData();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [heroRes, servicesRes, awardsRes, galleryRes, aboutRes] = await Promise.all([
        axios.get('https://sateesh-kumar-portfolio.onrender.com/api/hero').catch(() => ({ data: {} })),
        axios.get('https://sateesh-kumar-portfolio.onrender.com/api/services').catch(() => ({ data: [] })),
        axios.get('https://sateesh-kumar-portfolio.onrender.com/api/awards').catch(() => ({ data: [] })),
        axios.get('https://sateesh-kumar-portfolio.onrender.com/api/gallery?limit=100').catch(() => ({ data: [] })),
        axios.get('https://sateesh-kumar-portfolio.onrender.com/api/about').catch(() => ({ data: {} }))
      ]);
      
      setHeroData(heroRes.data || {});
      setServices(servicesRes.data || []);
      setAwards(awardsRes.data || []);
      setGallery(galleryRes.data || []);
      setAboutData(aboutRes.data || {});
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file, type, relatedId = null, category = 'general', title = '') => {
    setUploading(true);
    setUploadProgress(0);
    
    try {
      console.log('Starting Cloudinary upload for:', type);
      
      const imageUrl = await uploadToCloudinary(file, (progress) => {
        setUploadProgress(progress);
      });

      console.log('Upload successful:', imageUrl);

      if (type === 'hero') {
        await saveHeroImage(imageUrl);
      } else if (type === 'service' && relatedId) {
        await saveServiceImage(relatedId, imageUrl, title || '');
      } else if (type === 'award' && relatedId) {
        await saveAwardImage(relatedId, imageUrl, title || '');
      } else if (type === 'about') {
        await saveAboutImage(imageUrl);
      } else if (type === 'gallery') {
        await saveGalleryItem(imageUrl, title || '', category);
      } else if (type === 'profile') {
        await saveGalleryItem(imageUrl, 'Profile Photo', 'profile');
      }

      await fetchAllData();
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} image uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const saveHeroImage = async (imageUrl) => {
    try {
      const currentHero = heroData || {};
      const updatedHero = {
        ...currentHero,
        image: imageUrl,
        title: currentHero.title || 'Shri Puttagunta Venkata Sateesh Kumar',
        subtitle: currentHero.subtitle || 'Dedicated Social Worker & Community Leader',
        stats: currentHero.stats || [
          { number: '20+', text: 'Years of Service', icon: 'Award' },
          { number: '100+', text: 'Community Camps', icon: 'Users' },
          { number: '5000+', text: 'Lives Impacted', icon: 'Heart' }
        ],
        ctaText: currentHero.ctaText || 'Explore Journey'
      };

      const response = await axios.put('https://sateesh-kumar-portfolio.onrender.com/api/hero', updatedHero);
      setHeroData(response.data);
    } catch (error) {
      console.error('Error saving hero image:', error);
      throw error;
    }
  };

  const saveServiceImage = async (serviceId, imageUrl, title) => {
    try {
      const service = services.find(s => s._id === serviceId);
      const newImage = { url: imageUrl, title: title || 'Service Image' };
      const updatedImages = [...(service?.images || []), newImage];

      const response = await axios.put(`https://sateesh-kumar-portfolio.onrender.com/api/services/${serviceId}`, {
        ...service,
        images: updatedImages,
        mainImage: service?.mainImage || imageUrl
      });
      return response.data;
    } catch (error) {
      console.error('Error saving service image:', error);
      throw error;
    }
  };

  const saveAwardImage = async (awardId, imageUrl, title) => {
    try {
      const award = awards.find(a => a._id === awardId);
      const newImage = { url: imageUrl, title: title || 'Award Image' };
      const updatedImages = [...(award?.images || []), newImage];

      const response = await axios.put(`https://sateesh-kumar-portfolio.onrender.com/api/awards/${awardId}`, {
        ...award,
        images: updatedImages,
        mainImage: award?.mainImage || imageUrl
      });
      return response.data;
    } catch (error) {
      console.error('Error saving award image:', error);
      throw error;
    }
  };

  const saveAboutImage = async (imageUrl) => {
    try {
      const currentAbout = aboutData || {};
      const updatedAbout = {
        ...currentAbout,
        image: imageUrl,
        title: currentAbout.title || 'Puttagunta Venkata Sateesh Kumar',
        position: currentAbout.position || 'National Trustee of VHP, Vishwa Hindu Parishad',
        bio: currentAbout.bio || '',
        sectionTitle: currentAbout.sectionTitle || 'About Me',
        imageAspectRatio: currentAbout.imageAspectRatio || '3/4',
        badges: currentAbout.badges || []
      };

      const response = await axios.put('https://sateesh-kumar-portfolio.onrender.com/api/about', updatedAbout);
      setAboutData(response.data);
    } catch (error) {
      console.error('Error saving about image:', error);
      throw error;
    }
  };

  const saveGalleryItem = async (imageUrl, title, category = 'general') => {
    try {
      const response = await axios.post('https://sateesh-kumar-portfolio.onrender.com/api/gallery', {
        title,
        image: imageUrl,
        category,
        description: `Uploaded ${new Date().toLocaleDateString()}`
      });
      return response.data;
    } catch (error) {
      console.error('Error saving gallery item:', error);
      throw error;
    }
  };

  const tabs = [
    { id: 'hero', icon: User, label: 'Hero Section' },
    { id: 'about', icon: Users, label: 'About Sections' },
    { id: 'services', icon: Settings, label: 'Services' },
    { id: 'awards', icon: Award, label: 'Awards' },
    { id: 'gallery', icon: Image, label: 'Gallery' }
  ];

  const getActiveComponent = () => {
    const components = {
      hero: HeroManagement,
      about: AboutManagement,
      services: ServicesManagement,
      awards: AwardsManagement,
      gallery: GalleryManagement
    };
    
    const Component = components[activeTab];
    return Component ? (
      <Component
        data={{
          hero: heroData,
          services,
          awards,
          gallery,
          about: aboutData
        }}
        onUpload={handleImageUpload}
        uploading={uploading}
        uploadProgress={uploadProgress}
        onRefresh={fetchAllData}
        onUpdate={setAboutData}
      />
    ) : null;
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 pt-16 md:pt-20">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-500 to-purple-600 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg mt-2 rounded-2xl shadow-2xl border border-white/20 p-4">
            <div className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-3 w-full p-3 rounded-xl font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full p-3 rounded-xl font-semibold text-red-600 hover:bg-red-50 transition-colors mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          {/* Desktop Header */}
          <div className="hidden md:block bg-gradient-to-r from-blue-500 to-purple-600 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <Cloud className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
                  <p className="text-blue-100">Manage Portfolio Content • Cloudinary Uploads</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchAllData}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-xl text-white hover:bg-white/30 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-xl text-white hover:bg-white/30 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="bg-blue-50 border-b border-blue-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Uploading to Cloudinary...</span>
                <span className="text-sm font-bold text-blue-700">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-yellow-50 border-b border-yellow-200 p-4">
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />
                <span className="text-sm font-medium text-yellow-700">Loading data...</span>
              </div>
            </div>
          )}

          {/* Desktop Tabs */}
          <div className="hidden md:block border-b border-gray-200">
            <div className="flex space-x-1 px-8 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Tab Indicator */}
          <div className="md:hidden bg-gradient-to-r from-blue-500 to-purple-500 p-4">
            <div className="flex items-center justify-center space-x-2">
              {(() => {
                const activeTabInfo = tabs.find(tab => tab.id === activeTab);
                return activeTabInfo?.icon ? <activeTabInfo.icon className="w-5 h-5 text-white" /> : null;
              })()}
              <span className="text-white font-semibold text-lg">
                {tabs.find(tab => tab.id === activeTab)?.label}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 lg:p-8">
            {getActiveComponent()}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Hero Management Component with updated colors
const HeroManagement = ({ data, onUpload, uploading, uploadProgress, onRefresh }) => {
  const [hero, setHero] = useState(data.hero || {});
  const [profileImage, setProfileImage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tempHero, setTempHero] = useState({});

  useEffect(() => {
    setHero(data.hero || {});
    setTempHero(data.hero || {});
    fetchProfileImage();
  }, [data.hero]);

  const fetchProfileImage = async () => {
    try {
      const response = await axios.get('https://sateesh-kumar-portfolio.onrender.com/api/gallery?category=profile&limit=1');
      if (response.data.length > 0) {
        setProfileImage(response.data[0].image);
      } else {
        setProfileImage('');
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
      setProfileImage('');
    }
  };

  const handleHeroImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      await onUpload(file, 'hero');
      event.target.value = '';
    }
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      await onUpload(file, 'profile');
      setTimeout(fetchProfileImage, 1000);
      event.target.value = '';
    }
  };

  const updateHero = async (updates) => {
    try {
      const response = await axios.put('https://sateesh-kumar-portfolio.onrender.com/api/hero', { ...hero, ...updates });
      setHero(response.data);
      setTempHero(response.data);
      setIsEditing(false);
      alert('Hero content updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      alert('Error updating hero content: ' + error.message);
    }
  };

  const handleEdit = () => {
    setTempHero({...hero});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTempHero({...hero});
    setIsEditing(false);
  };

  const handleSave = () => {
    updateHero(tempHero);
  };

  const handleTempChange = (field, value) => {
    setTempHero(prev => ({ ...prev, [field]: value }));
  };

  const handleStatChange = (index, field, value) => {
    const newStats = [...(tempHero.stats || [])];
    if (!newStats[index]) {
      newStats[index] = { number: '', text: '' };
    }
    newStats[index][field] = value;
    setTempHero(prev => ({ ...prev, stats: newStats }));
  };

  const handleAddStat = () => {
    const newStats = [...(tempHero.stats || []), { number: '', text: '' }];
    setTempHero(prev => ({ ...prev, stats: newStats }));
  };

  const handleDeleteStat = (index) => {
    const newStats = [...(tempHero.stats || [])];
    newStats.splice(index, 1);
    setTempHero(prev => ({ ...prev, stats: newStats }));
  };

  useEffect(() => {
    if (!hero.title && !hero.subtitle) {
      const initialHero = {
        title: 'Shri Puttagunta Venkata Sateesh Kumar',
        subtitle: 'Dedicated Social Worker & Community Leader',
        image: hero.image || '',
        stats: hero.stats || [
          { number: '20+', text: 'Years of Service', icon: 'Award' },
          { number: '100+', text: 'Community Camps', icon: 'Users' },
          { number: '5000+', text: 'Lives Impacted', icon: 'Heart' }
        ],
        ctaText: hero.ctaText || 'Explore Journey'
      };
      setHero(initialHero);
      setTempHero(initialHero);
    }
  }, [hero]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Hero Section Management</h3>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all w-full sm:w-auto"
          >
            <Edit className="w-5 h-5" />
            <span>Edit Content</span>
          </button>
        ) : (
          <div className="flex space-x-3 w-full sm:w-auto">
            <button
              onClick={handleCancel}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition-colors"
            >
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>Save</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Upload Section */}
        <div className="space-y-6">
          {/* Hero Background Image */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-blue-100">
            <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center space-x-2 text-blue-700">
              <Cloud className="w-5 h-5 text-blue-500" />
              <span>Background Image</span>
            </h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-blue-300 rounded-2xl p-4 sm:p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeroImageChange}
                  className="hidden"
                  id="hero-upload"
                  disabled={uploading}
                />
                <label htmlFor="hero-upload" className="cursor-pointer block">
                  {uploading ? (
                    <div className="space-y-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-blue-600 font-medium text-sm sm:text-base">Uploading Background... {uploadProgress}%</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 mx-auto mb-4" />
                      <p className="text-blue-600 font-medium">Click to upload background image</p>
                      <p className="text-sm text-blue-500 mt-2">Max 10MB • JPG, PNG, WebP</p>
                    </>
                  )}
                </label>
              </div>
              
              {hero?.image && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-blue-700 mb-2">Current Background:</p>
                  <div className="relative">
                    <img
                      src={hero.image}
                      alt="Current Hero Background"
                      className="w-full h-32 sm:h-48 object-cover rounded-2xl shadow-lg"
                      onError={(e) => {
                        console.error('Error loading hero image:', hero.image);
                        e.target.style.display = 'none';
                      }}
                    />
                    <button
                      onClick={async () => {
                        try {
                          await axios.put('https://sateesh-kumar-portfolio.onrender.com/api/hero', { ...hero, image: '' });
                          setHero(prev => ({ ...prev, image: '' }));
                          setTempHero(prev => ({ ...prev, image: '' }));
                          alert('Background image removed successfully!');
                        } catch (error) {
                          console.error('Error removing background image:', error);
                          alert('Error removing background image: ' + error.message);
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Profile Image Upload */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 sm:p-6 border border-purple-100">
            <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center space-x-2 text-purple-700">
              <User className="w-5 h-5 text-purple-500" />
              <span>Profile Photo</span>
            </h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-purple-300 rounded-2xl p-4 sm:p-6 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="hidden"
                  id="profile-upload"
                  disabled={uploading}
                />
                <label htmlFor="profile-upload" className="cursor-pointer block">
                  {uploading ? (
                    <div className="space-y-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-purple-600 font-medium text-sm sm:text-base">Uploading Profile... {uploadProgress}%</p>
                    </div>
                  ) : (
                    <>
                      <User className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400 mx-auto mb-4" />
                      <p className="text-purple-600 font-medium">Click to upload profile photo</p>
                      <p className="text-sm text-purple-500 mt-2">Square images work best</p>
                    </>
                  )}
                </label>
              </div>
              
              {profileImage && (
                <div className="mt-4 text-center">
                  <p className="text-sm font-medium text-purple-700 mb-2">Current Profile:</p>
                  <div className="relative inline-block">
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-full shadow-lg mx-auto border-4 border-white"
                      onError={(e) => {
                        console.error('Error loading profile image:', profileImage);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">Hero Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Title</label>
                <input
                  type="text"
                  value={isEditing ? (tempHero?.title || '') : (hero?.title || '')}
                  onChange={(e) => isEditing && handleTempChange('title', e.target.value)}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter hero title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Subtitle</label>
                <textarea
                  value={isEditing ? (tempHero?.subtitle || '') : (hero?.subtitle || '')}
                  onChange={(e) => isEditing && handleTempChange('subtitle', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter hero subtitle"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Call to Action Text</label>
                <input
                  type="text"
                  value={isEditing ? (tempHero?.ctaText || 'Explore Journey') : (hero?.ctaText || 'Explore Journey')}
                  onChange={(e) => isEditing && handleTempChange('ctaText', e.target.value)}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter CTA text"
                />
              </div>
            </div>
          </div>

          {/* Stats Management */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">Statistics</h3>
              {isEditing && (
                <button
                  onClick={handleAddStat}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors text-sm w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Stat</span>
                </button>
              )}
            </div>
            <div className="space-y-3">
              {(isEditing ? tempHero?.stats : hero?.stats)?.map((stat, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 items-start sm:items-center">
                  <input
                    type="text"
                    value={stat.number}
                    onChange={(e) => isEditing && handleStatChange(index, 'number', e.target.value)}
                    disabled={!isEditing}
                    className="flex-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Number"
                  />
                  <input
                    type="text"
                    value={stat.text}
                    onChange={(e) => isEditing && handleStatChange(index, 'text', e.target.value)}
                    disabled={!isEditing}
                    className="flex-1 w-full p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Text"
                  />
                  {isEditing && (
                    <button
                      onClick={() => handleDeleteStat(index)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors w-full sm:w-auto"
                      title="Delete Stat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {isEditing && (!tempHero?.stats || tempHero.stats.length === 0) && (
                <div className="text-center py-4 text-gray-500">
                  <p>No statistics added yet. Click "Add Stat" to create one.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Services Management Component with updated colors
const ServicesManagement = ({ data, onUpload, uploading, uploadProgress, onRefresh }) => {
  const [services, setServices] = useState(data.services || []);
  const [selectedService, setSelectedService] = useState(null);
  const [imageTitle, setImageTitle] = useState('');
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    icon: 'Users',
    stats: '100+ People Helped',
    gradient: 'from-blue-500 to-purple-500',
    features: ['Quality Service', 'Community Focus', 'Professional Team']
  });
  const [featuresInput, setFeaturesInput] = useState('');
  const [newServiceFeaturesInput, setNewServiceFeaturesInput] = useState('Quality Service, Community Focus, Professional Team');
  const [isEditing, setIsEditing] = useState(false);
  const [tempService, setTempService] = useState({});

  useEffect(() => {
    setServices(data.services || []);
    if (data.services && data.services.length > 0 && !selectedService) {
      setSelectedService(data.services[0]);
    }
  }, [data.services]);

  useEffect(() => {
    if (selectedService) {
      setFeaturesInput(selectedService.features?.join(', ') || '');
      setTempService(selectedService);
    }
  }, [selectedService]);

  const createService = async () => {
    try {
      const featuresArray = newServiceFeaturesInput.split(',')
        .map(feature => feature.trim())
        .filter(feature => feature);
      
      const serviceToCreate = {
        ...newService,
        features: featuresArray,
        images: [],
        mainImage: ''
      };

      const response = await axios.post('https://sateesh-kumar-portfolio.onrender.com/api/services', serviceToCreate);
      setServices(prev => [...prev, response.data]);
      setSelectedService(response.data);
      setNewService({
        title: '',
        description: '',
        icon: 'Users',
        stats: '100+ People Helped',
        gradient: 'from-blue-500 to-purple-500',
        features: ['Quality Service', 'Community Focus', 'Professional Team']
      });
      setNewServiceFeaturesInput('Quality Service, Community Focus, Professional Team');
      setFeaturesInput('');
      alert('Service created successfully!');
    } catch (error) {
      console.error('Create error:', error);
      alert('Error creating service: ' + error.message);
    }
  };

  const updateService = async (updates) => {
    try {
      const response = await axios.put(`https://sateesh-kumar-portfolio.onrender.com/api/services/${selectedService._id}`, updates);
      const updatedService = response.data;
      setServices(prev => prev.map(s => s._id === selectedService._id ? updatedService : s));
      setSelectedService(updatedService);
      setTempService(updatedService);
      setIsEditing(false);
      alert('Service updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      alert('Error updating service: ' + error.message);
    }
  };

  const deleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await axios.delete(`https://sateesh-kumar-portfolio.onrender.com/api/services/${serviceId}`);
        setServices(prev => prev.filter(s => s._id !== serviceId));
        if (selectedService && selectedService._id === serviceId) {
          setSelectedService(services.length > 1 ? services.find(s => s._id !== serviceId) : null);
        }
        alert('Service deleted successfully!');
      } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting service: ' + error.message);
      }
    }
  };

  const handleServiceImageUpload = async (serviceId, file) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    await onUpload(file, 'service', serviceId, 'general', imageTitle || '');
    setImageTitle('');
  };

  const setMainImage = async (serviceId, imageUrl) => {
    try {
      await axios.put(`https://sateesh-kumar-portfolio.onrender.com/api/services/${serviceId}`, { mainImage: imageUrl });
      onRefresh();
      alert('Main image set successfully!');
    } catch (error) {
      console.error('Set main image error:', error);
      alert('Error setting main image: ' + error.message);
    }
  };

  const deleteServiceImage = async (serviceId, imageUrl) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        const service = services.find(s => s._id === serviceId);
        const updatedImages = (service.images || []).filter(img => img.url !== imageUrl);

        await axios.put(`https://sateesh-kumar-portfolio.onrender.com/api/services/${serviceId}`, {
          ...service,
          images: updatedImages,
          mainImage: service.mainImage === imageUrl ? '' : service.mainImage
        });
        
        onRefresh();
        alert('Image deleted successfully!');
      } catch (error) {
        console.error('Delete image error:', error);
        alert('Error deleting image: ' + error.message);
      }
    }
  };

  const handleFeaturesChange = (featuresString) => {
    setFeaturesInput(featuresString);
    if (isEditing) {
      const featuresArray = featuresString.split(',').map(feature => feature.trim()).filter(feature => feature);
      setTempService(prev => ({ ...prev, features: featuresArray }));
    }
  };

  const handleNewServiceFeaturesChange = (featuresString) => {
    setNewServiceFeaturesInput(featuresString);
  };

  const handleEdit = () => {
    setTempService({...selectedService});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTempService({...selectedService});
    setIsEditing(false);
    setFeaturesInput(selectedService.features?.join(', ') || '');
  };

  const handleSave = () => {
    updateService(tempService);
  };

  const handleTempChange = (field, value) => {
    setTempService(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Services Management</h3>
        <button
          onClick={createService}
          disabled={!newService.title.trim()}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Create New Service Form */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-blue-100">
        <h4 className="text-lg font-semibold mb-4 text-blue-700">Create New Service</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Service Title *"
            value={newService.title}
            onChange={(e) => setNewService(prev => ({ ...prev, title: e.target.value }))}
            className="p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Service Stats (e.g., 100+ People Helped)"
            value={newService.stats}
            onChange={(e) => setNewService(prev => ({ ...prev, stats: e.target.value }))}
            className="p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <textarea
            placeholder="Service Description"
            value={newService.description}
            onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="p-3 border border-blue-300 rounded-xl resize-none md:col-span-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2 text-blue-700">Features (comma separated)</label>
            <input
              type="text"
              value={newServiceFeaturesInput}
              onChange={(e) => handleNewServiceFeaturesChange(e.target.value)}
              className="w-full p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Quality Service, Community Focus, Professional Team"
            />
            <p className="text-xs text-blue-600 mt-1">
              Type features separated by commas. You can type commas normally.
            </p>
            <p className="text-xs text-purple-600 mt-1 font-medium">
              Preview: {newServiceFeaturesInput.split(',').map(f => f.trim()).filter(f => f).join(' • ')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services List */}
        <div className="lg:col-span-1 space-y-4">
          <h4 className="text-lg font-semibold mb-4 text-gray-700">Existing Services ({services.length})</h4>
          {services.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
              <Settings className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No services found</p>
            </div>
          ) : (
            services.map(service => (
              <div
                key={service._id}
                onClick={() => setSelectedService(service)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedService?._id === service._id
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{service.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {(service.images?.length || 0)} images
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteService(service._id);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Service Details */}
        {selectedService && (
          <div className="lg:col-span-2 space-y-6">
            {/* Edit/Save Buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              <h4 className="text-xl font-bold text-gray-800">Service Details</h4>
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all w-full sm:w-auto"
                >
                  <Edit className="w-5 h-5" />
                  <span>Edit Content</span>
                </button>
              ) : (
                <div className="flex space-x-3 w-full sm:w-auto">
                  <button
                    onClick={handleCancel}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Title</label>
                  <input
                    type="text"
                    value={isEditing ? (tempService?.title || '') : (selectedService?.title || '')}
                    onChange={(e) => isEditing && handleTempChange('title', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Description</label>
                  <textarea
                    value={isEditing ? (tempService?.description || '') : (selectedService?.description || '')}
                    onChange={(e) => isEditing && handleTempChange('description', e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full p-3 border rounded-xl resize-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Stats</label>
                  <input
                    type="text"
                    value={isEditing ? (tempService?.stats || '') : (selectedService?.stats || '')}
                    onChange={(e) => isEditing && handleTempChange('stats', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Features (comma separated)</label>
                  <input
                    type="text"
                    value={featuresInput}
                    onChange={(e) => handleFeaturesChange(e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Quality Service, Community Focus, Professional Team"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    Type features separated by commas. You can type commas normally.
                  </p>
                  <p className="text-xs text-purple-600 mt-1 font-medium">
                    Preview: {featuresInput.split(',').map(f => f.trim()).filter(f => f).join(' • ')}
                  </p>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-blue-100">
                  <h4 className="text-lg font-semibold mb-4 text-blue-700">Add Service Images</h4>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Image Title (optional)"
                      value={imageTitle}
                      onChange={(e) => setImageTitle(e.target.value)}
                      className="w-full p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    <div className="border-2 border-dashed border-blue-300 rounded-2xl p-4 sm:p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleServiceImageUpload(selectedService._id, file);
                            e.target.value = '';
                          }
                        }}
                        className="hidden"
                        id={`service-upload-${selectedService._id}`}
                        disabled={uploading}
                      />
                      <label 
                        htmlFor={`service-upload-${selectedService._id}`} 
                        className="cursor-pointer block"
                      >
                        {uploading ? (
                          <div className="space-y-4">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-blue-600 font-medium">Uploading... {uploadProgress}%</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                            <p className="text-blue-600 font-medium">Click to upload service image</p>
                            <p className="text-sm text-blue-500 mt-2">Max 10MB • JPG, PNG, WebP</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Current Images */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">
                    Service Images ({(selectedService.images || []).length})
                  </h4>
                  
                  {(selectedService.images || []).length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Image className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No images uploaded yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {(selectedService.images || []).map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.url}
                            alt={image.title}
                            className="w-full h-20 sm:h-24 object-cover rounded-xl shadow-sm"
                            onError={(e) => {
                              console.error('Error loading service image:', image.url);
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all rounded-xl flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => setMainImage(selectedService._id, image.url)}
                              className={`p-2 rounded-full ${
                                selectedService.mainImage === image.url 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-white text-gray-700 hover:bg-gray-100'
                              }`}
                              title={selectedService.mainImage === image.url ? 'Main Image' : 'Set as Main'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteServiceImage(selectedService._id, image.url)}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                              title="Delete Image"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {selectedService.mainImage === image.url && (
                            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              Main
                            </div>
                          )}
                          <p className="text-xs text-gray-600 mt-2 truncate">{image.title}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Awards Management Component with updated colors
const AwardsManagement = ({ data, onUpload, uploading, uploadProgress, onRefresh }) => {
  const [awards, setAwards] = useState(data.awards || []);
  const [selectedAward, setSelectedAward] = useState(null);
  const [imageTitle, setImageTitle] = useState('');
  const [newAward, setNewAward] = useState({
    title: '',
    organization: '',
    year: new Date().getFullYear(),
    description: '',
    category: 'social-work'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempAward, setTempAward] = useState({});

  useEffect(() => {
    setAwards(data.awards || []);
    if (data.awards && data.awards.length > 0 && !selectedAward) {
      setSelectedAward(data.awards[0]);
    }
  }, [data.awards]);

  useEffect(() => {
    if (selectedAward) {
      setTempAward(selectedAward);
    }
  }, [selectedAward]);

  const createAward = async () => {
    try {
      const awardToCreate = {
        ...newAward,
        images: [],
        mainImage: ''
      };

      const response = await axios.post('http://localhost:5000/api/awards', awardToCreate);
      setAwards(prev => [...prev, response.data]);
      setSelectedAward(response.data);
      setNewAward({
        title: '',
        organization: '',
        year: new Date().getFullYear(),
        description: '',
        category: 'social-work'
      });
      alert('Award created successfully!');
    } catch (error) {
      console.error('Create error:', error);
      alert('Error creating award: ' + error.message);
    }
  };

  const updateAward = async (updates) => {
    try {
      const response = await axios.put(`https://sateesh-kumar-portfolio.onrender.com/api/awards/${selectedAward._id}`, updates);
      const updatedAward = response.data;
      setAwards(prev => prev.map(a => a._id === selectedAward._id ? updatedAward : a));
      setSelectedAward(updatedAward);
      setTempAward(updatedAward);
      setIsEditing(false);
      alert('Award updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      alert('Error updating award: ' + error.message);
    }
  };

  const deleteAward = async (awardId) => {
    if (window.confirm('Are you sure you want to delete this award?')) {
      try {
        await axios.delete(`https://sateesh-kumar-portfolio.onrender.com/api/awards/${awardId}`);
        setAwards(prev => prev.filter(a => a._id !== awardId));
        if (selectedAward && selectedAward._id === awardId) {
          setSelectedAward(awards.length > 1 ? awards.find(a => a._id !== awardId) : null);
        }
        alert('Award deleted successfully!');
      } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting award: ' + error.message);
      }
    }
  };

  const handleAwardImageUpload = async (awardId, file) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    await onUpload(file, 'award', awardId, 'general', imageTitle || '');
    setImageTitle('');
  };

  const setMainImage = async (awardId, imageUrl) => {
    try {
      await axios.put(`https://sateesh-kumar-portfolio.onrender.com/api/awards/${awardId}`, { mainImage: imageUrl });
      onRefresh();
      alert('Main image set successfully!');
    } catch (error) {
      console.error('Set main image error:', error);
      alert('Error setting main image: ' + error.message);
    }
  };

  const deleteAwardImage = async (awardId, imageUrl) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        const award = awards.find(a => a._id === awardId);
        const updatedImages = (award.images || []).filter(img => img.url !== imageUrl);

        await axios.put(`https://sateesh-kumar-portfolio.onrender.com/api/awards/${awardId}`, {
          ...award,
          images: updatedImages,
          mainImage: award.mainImage === imageUrl ? '' : award.mainImage
        });
        
        onRefresh();
        alert('Image deleted successfully!');
      } catch (error) {
        console.error('Delete image error:', error);
        alert('Error deleting image: ' + error.message);
      }
    }
  };

  const handleEdit = () => {
    setTempAward({...selectedAward});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTempAward({...selectedAward});
    setIsEditing(false);
  };

  const handleSave = () => {
    updateAward(tempAward);
  };

  const handleTempChange = (field, value) => {
    setTempAward(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Awards Management</h3>
        <button
          onClick={createAward}
          disabled={!newAward.title.trim()}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add Award</span>
        </button>
      </div>

      {/* Create New Award Form */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-blue-100">
        <h4 className="text-lg font-semibold mb-4 text-blue-700">Create New Award</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Award Title *"
            value={newAward.title}
            onChange={(e) => setNewAward(prev => ({ ...prev, title: e.target.value }))}
            className="p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Organization"
            value={newAward.organization}
            onChange={(e) => setNewAward(prev => ({ ...prev, organization: e.target.value }))}
            className="p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="number"
            placeholder="Year"
            value={newAward.year}
            onChange={(e) => setNewAward(prev => ({ ...prev, year: parseInt(e.target.value) || '' }))}
            className="p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={newAward.category}
            onChange={(e) => setNewAward(prev => ({ ...prev, category: e.target.value }))}
            className="p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="social-work">Social Work</option>
            <option value="community">Community Service</option>
            <option value="leadership">Leadership</option>
            <option value="achievement">Achievement</option>
            <option value="recognition">Recognition</option>
          </select>
          <textarea
            placeholder="Description"
            value={newAward.description}
            onChange={(e) => setNewAward(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="p-3 border border-blue-300 rounded-xl resize-none md:col-span-2 lg:col-span-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Awards List */}
        <div className="lg:col-span-1 space-y-4">
          <h4 className="text-lg font-semibold mb-4 text-gray-700">Existing Awards ({awards.length})</h4>
          {awards.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
              <Award className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No awards found</p>
            </div>
          ) : (
            awards.map(award => (
              <div
                key={award._id}
                onClick={() => setSelectedAward(award)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedAward?._id === award._id
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{award.title}</h4>
                    <p className="text-sm text-gray-600">{award.organization} • {award.year}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(award.images?.length || 0)} images
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAward(award._id);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Award Details */}
        {selectedAward && (
          <div className="lg:col-span-2 space-y-6">
            {/* Edit/Save Buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              <h4 className="text-xl font-bold text-gray-800">Award Details</h4>
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all w-full sm:w-auto"
                >
                  <Edit className="w-5 h-5" />
                  <span>Edit Content</span>
                </button>
              ) : (
                <div className="flex space-x-3 w-full sm:w-auto">
                  <button
                    onClick={handleCancel}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Title</label>
                  <input
                    type="text"
                    value={isEditing ? (tempAward?.title || '') : (selectedAward?.title || '')}
                    onChange={(e) => isEditing && handleTempChange('title', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Organization</label>
                  <input
                    type="text"
                    value={isEditing ? (tempAward?.organization || '') : (selectedAward?.organization || '')}
                    onChange={(e) => isEditing && handleTempChange('organization', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Year</label>
                  <input
                    type="number"
                    value={isEditing ? (tempAward?.year || '') : (selectedAward?.year || '')}
                    onChange={(e) => isEditing && handleTempChange('year', parseInt(e.target.value) || '')}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Category</label>
                  <select
                    value={isEditing ? (tempAward?.category || 'social-work') : (selectedAward?.category || 'social-work')}
                    onChange={(e) => isEditing && handleTempChange('category', e.target.value)}
                    disabled={!isEditing}
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="social-work">Social Work</option>
                    <option value="community">Community Service</option>
                    <option value="leadership">Leadership</option>
                    <option value="achievement">Achievement</option>
                    <option value="recognition">Recognition</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Description</label>
                  <textarea
                    value={isEditing ? (tempAward?.description || '') : (selectedAward?.description || '')}
                    onChange={(e) => isEditing && handleTempChange('description', e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full p-3 border rounded-xl resize-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-blue-100">
                  <h4 className="text-lg font-semibold mb-4 text-blue-700">Add Award Images</h4>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Image Title (optional)"
                      value={imageTitle}
                      onChange={(e) => setImageTitle(e.target.value)}
                      className="w-full p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    <div className="border-2 border-dashed border-blue-300 rounded-2xl p-4 sm:p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleAwardImageUpload(selectedAward._id, file);
                            e.target.value = '';
                          }
                        }}
                        className="hidden"
                        id={`award-upload-${selectedAward._id}`}
                        disabled={uploading}
                      />
                      <label 
                        htmlFor={`award-upload-${selectedAward._id}`} 
                        className="cursor-pointer block"
                      >
                        {uploading ? (
                          <div className="space-y-4">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-blue-600 font-medium">Uploading... {uploadProgress}%</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                            <p className="text-blue-600 font-medium">Click to upload award image</p>
                            <p className="text-sm text-blue-500 mt-2">Max 10MB • JPG, PNG, WebP</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Current Images */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">
                    Award Images ({(selectedAward.images || []).length})
                  </h4>
                  
                  {(selectedAward.images || []).length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Image className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No images uploaded yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {(selectedAward.images || []).map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.url}
                            alt={image.title}
                            className="w-full h-20 sm:h-24 object-cover rounded-xl shadow-sm"
                            onError={(e) => {
                              console.error('Error loading award image:', image.url);
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all rounded-xl flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => setMainImage(selectedAward._id, image.url)}
                              className={`p-2 rounded-full ${
                                selectedAward.mainImage === image.url 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-white text-gray-700 hover:bg-gray-100'
                              }`}
                              title={selectedAward.mainImage === image.url ? 'Main Image' : 'Set as Main'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteAwardImage(selectedAward._id, image.url)}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                              title="Delete Image"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {selectedAward.mainImage === image.url && (
                            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              Main
                            </div>
                          )}
                          <p className="text-xs text-gray-600 mt-2 truncate">{image.title}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// About Management Component with updated colors
const AboutManagement = ({ data, onUpload, uploading, uploadProgress, onUpdate, onRefresh }) => {
  const [aboutData, setAboutData] = useState(data.about || {});
  const [isEditing, setIsEditing] = useState(false);
  const [tempAbout, setTempAbout] = useState({});
  const [newBadge, setNewBadge] = useState({
    title: '',
    icon: 'Award',
    position: 'top-right',
    color: 'from-blue-500 to-purple-500'
  });

  useEffect(() => {
    setAboutData(data.about || {});
    setTempAbout(data.about || {});
  }, [data.about]);

  const handleAboutImageUpload = async (file) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    
    try {
      const imageUrl = await onUpload(file, 'about');
      
      if (imageUrl) {
        const updatedAbout = {
          ...aboutData,
          image: imageUrl
        };
        setAboutData(updatedAbout);
        setTempAbout(updatedAbout);
        
        await updateAboutData({ image: imageUrl });
        if (onUpdate) onUpdate(updatedAbout);
        alert('Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Error uploading image: ' + error.message);
    }
  };

  const updateAboutData = async (updates) => {
    try {
      const response = await axios.patch('https://sateesh-kumar-portfolio.onrender.com/api/about', updates);
      const updatedData = response.data;
      setAboutData(updatedData);
      setTempAbout(updatedData);
      setIsEditing(false);
      if (onUpdate) onUpdate(updatedData);
      alert('About information updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      alert('Error updating about information: ' + error.message);
    }
  };

  const deleteAboutImage = async () => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await axios.patch('https://sateesh-kumar-portfolio.onrender.com/api/about', { image: '' });
        const updatedAbout = { ...aboutData, image: '' };
        setAboutData(updatedAbout);
        setTempAbout(updatedAbout);
        if (onUpdate) onUpdate(updatedAbout);
        alert('Image deleted successfully!');
      } catch (error) {
        console.error('Delete image error:', error);
        alert('Error deleting image: ' + error.message);
      }
    }
  };

  const handleEdit = () => {
    setTempAbout({...aboutData});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTempAbout({...aboutData});
    setIsEditing(false);
  };

  const handleSave = () => {
    updateAboutData(tempAbout);
  };

  const handleTempChange = (field, value) => {
    setTempAbout(prev => ({ ...prev, [field]: value }));
  };

  const addBadge = async () => {
    if (!newBadge.title.trim()) {
      alert('Please enter a badge title');
      return;
    }

    try {
      const response = await axios.post('https://sateesh-kumar-portfolio.onrender.com/api/about/badges', newBadge);
      const updatedData = response.data;
      setAboutData(updatedData);
      setTempAbout(updatedData);
      setNewBadge({
        title: '',
        icon: 'Award',
        position: 'top-right',
        color: 'from-blue-500 to-purple-500'
      });
      if (onUpdate) onUpdate(updatedData);
      alert('Badge added successfully!');
    } catch (error) {
      console.error('Add badge error:', error);
      alert('Error adding badge: ' + error.message);
    }
  };

  const deleteBadge = async (badgeId) => {
    if (window.confirm('Are you sure you want to delete this badge?')) {
      try {
        const response = await axios.delete(`https://sateesh-kumar-portfolio.onrender.com/api/about/badges/${badgeId}`);
        const updatedData = response.data;
        setAboutData(updatedData);
        setTempAbout(updatedData);
        if (onUpdate) onUpdate(updatedData);
        alert('Badge deleted successfully!');
      } catch (error) {
        console.error('Delete badge error:', error);
        alert('Error deleting badge: ' + error.message);
      }
    }
  };

  useEffect(() => {
    if (!aboutData.title && !aboutData.position) {
      const initialAbout = {
        title: 'Puttagunta Venkata Sateesh Kumar',
        position: 'National Trustee of VHP, Vishwa Hindu Parishad',
        sectionTitle: 'About Me',
        image: aboutData.image || '',
        bio: aboutData.bio || '',
        imageAspectRatio: aboutData.imageAspectRatio || '3/4',
        badges: aboutData.badges || []
      };
      setAboutData(initialAbout);
      setTempAbout(initialAbout);
    }
  }, [aboutData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">About Section Management</h3>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all w-full sm:w-auto"
          >
            <Edit className="w-5 h-5" />
            <span>Edit Content</span>
          </button>
        ) : (
          <div className="flex space-x-3 w-full sm:w-auto">
            <button
              onClick={handleCancel}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition-colors"
            >
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>Save</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Upload Section */}
        <div className="space-y-6">
          {/* About Image */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-blue-100">
            <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center space-x-2 text-blue-700">
              <Image className="w-5 h-5 text-blue-500" />
              <span>Profile Image</span>
            </h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-blue-300 rounded-2xl p-4 sm:p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleAboutImageUpload(file);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                  id="about-upload"
                  disabled={uploading}
                />
                <label htmlFor="about-upload" className="cursor-pointer block">
                  {uploading ? (
                    <div className="space-y-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-blue-600 font-medium text-sm sm:text-base">Uploading Image... {uploadProgress}%</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 mx-auto mb-4" />
                      <p className="text-blue-600 font-medium">Click to upload profile image</p>
                      <p className="text-sm text-blue-500 mt-2">Max 10MB • JPG, PNG, WebP</p>
                    </>
                  )}
                </label>
              </div>
              
              {aboutData?.image && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-blue-700 mb-2">Current Image:</p>
                  <div className="relative">
                    <img
                      src={aboutData.image}
                      alt="Current About Image"
                      className="w-full h-48 sm:h-64 object-cover rounded-2xl shadow-lg"
                      onError={(e) => {
                        console.error('Error loading about image:', aboutData.image);
                        e.target.style.display = 'none';
                      }}
                    />
                    <button
                      onClick={deleteAboutImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Badges Management */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 sm:p-6 border border-purple-100">
            <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center space-x-2 text-purple-700">
              <Award className="w-5 h-5 text-purple-500" />
              <span>Photo Badges & Tags</span>
            </h3>
            
            {/* Add New Badge */}
            <div className="space-y-4 mb-6 p-4 bg-blue-100 rounded-xl">
              <h4 className="font-semibold text-blue-800">Add New Badge</h4>
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  placeholder="Badge Title"
                  value={newBadge.title}
                  onChange={(e) => setNewBadge(prev => ({ ...prev, title: e.target.value }))}
                  className="p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newBadge.icon}
                  onChange={(e) => setNewBadge(prev => ({ ...prev, icon: e.target.value }))}
                  className="p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Award">Award</option>
                  <option value="Briefcase">Briefcase</option>
                  <option value="Users">Users</option>
                  <option value="Building">Building</option>
                  <option value="HeartHandshake">HeartHandshake</option>
                </select>
                <select
                  value={newBadge.position}
                  onChange={(e) => setNewBadge(prev => ({ ...prev, position: e.target.value }))}
                  className="p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
                <select
                  value={newBadge.color}
                  onChange={(e) => setNewBadge(prev => ({ ...prev, color: e.target.value }))}
                  className="p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="from-blue-500 to-purple-500">Blue to Purple</option>
                  <option value="from-purple-500 to-blue-500">Purple to Blue</option>
                  <option value="from-blue-500 to-cyan-500">Blue to Cyan</option>
                  <option value="from-purple-500 to-pink-500">Purple to Pink</option>
                </select>
                <button
                  onClick={addBadge}
                  disabled={!newBadge.title.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Badge
                </button>
              </div>
            </div>

            {/* Existing Badges */}
            <div className="space-y-3">
              <h4 className="font-semibold text-purple-800">Current Badges ({aboutData.badges?.length || 0})</h4>
              {aboutData.badges?.length === 0 ? (
                <p className="text-blue-600 text-sm">No badges added yet</p>
              ) : (
                aboutData.badges?.map((badge, index) => (
                  <div key={badge._id || index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${badge.color}`}></div>
                      <span className="font-medium text-blue-800">{badge.title}</span>
                      <span className="text-xs text-blue-600 capitalize">{badge.position}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => deleteBadge(badge._id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* About Content */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">About Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Section Title</label>
                <input
                  type="text"
                  value={isEditing ? (tempAbout?.sectionTitle || '') : (aboutData?.sectionTitle || '')}
                  onChange={(e) => isEditing && handleTempChange('sectionTitle', e.target.value)}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter section title (e.g., About Me)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={isEditing ? (tempAbout?.title || '') : (aboutData?.title || '')}
                  onChange={(e) => isEditing && handleTempChange('title', e.target.value)}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Position/Title</label>
                <input
                  type="text"
                  value={isEditing ? (tempAbout?.position || '') : (aboutData?.position || '')}
                  onChange={(e) => isEditing && handleTempChange('position', e.target.value)}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter position/title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Biography</label>
                <textarea
                  value={isEditing ? (tempAbout?.bio || '') : (aboutData?.bio || '')}
                  onChange={(e) => isEditing && handleTempChange('bio', e.target.value)}
                  disabled={!isEditing}
                  rows={12}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter detailed biography"
                />
                <p className="text-xs text-blue-600 mt-2">
                  This is the main biography content that will be displayed in the about section.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Image Aspect Ratio</label>
                <select
                  value={isEditing ? (tempAbout?.imageAspectRatio || '3/4') : (aboutData?.imageAspectRatio || '3/4')}
                  onChange={(e) => isEditing && handleTempChange('imageAspectRatio', e.target.value)}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="1/1">Square (1:1)</option>
                  <option value="3/4">Portrait (3:4)</option>
                  <option value="4/3">Landscape (4:3)</option>
                  <option value="16/9">Wide (16:9)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-blue-100">
            <h4 className="text-lg font-semibold mb-4 text-blue-700">Current Preview</h4>
            <div className="space-y-3 text-sm text-blue-700">
              <div className="flex justify-between">
                <span className="font-semibold">Section Title:</span>
                <span>{aboutData?.sectionTitle || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Name:</span>
                <span>{aboutData?.title || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Position:</span>
                <span>{aboutData?.position || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Image:</span>
                <span>{aboutData?.image ? '✓ Uploaded' : '✗ Not uploaded'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Aspect Ratio:</span>
                <span>{aboutData?.imageAspectRatio || '3/4'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Badges:</span>
                <span>{aboutData?.badges?.length || 0} badges</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="font-semibold">Bio Length:</span>
                <span className="text-right">{aboutData?.bio?.length || 0} characters</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Gallery Management Component with updated colors
const GalleryManagement = ({ data, onUpload, uploading, uploadProgress, onRefresh }) => {
  const [gallery, setGallery] = useState(data.gallery || []);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [imageTitle, setImageTitle] = useState('');
  const [imageCategory, setImageCategory] = useState('general');

  useEffect(() => {
    setGallery(data.gallery || []);
  }, [data.gallery]);

  const handleGalleryUpload = async (file) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    await onUpload(file, 'gallery', null, imageCategory, imageTitle || 'Gallery Image');
    setImageTitle('');
  };

  const deleteGalleryItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await axios.delete(`https://sateesh-kumar-portfolio.onrender.com/api/gallery/${itemId}`);
        setGallery(prev => prev.filter(item => item._id !== itemId));
        alert('Image deleted successfully!');
      } catch (error) {
        console.error('Delete error:', error);
        alert('Error deleting image: ' + error.message);
      }
    }
  };

  const categories = ['all', 'general', 'events', 'community', 'awards', 'profile'];
  const filteredGallery = selectedCategory === 'all' 
    ? gallery 
    : gallery.filter(item => item.category === selectedCategory);

  return (
    <div className="space-y-6">
      <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Gallery Management</h3>

      {/* Upload Section */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-blue-100">
        <h4 className="text-lg font-semibold mb-4 text-blue-700">Add Gallery Image</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Image Title (optional)"
            value={imageTitle}
            onChange={(e) => setImageTitle(e.target.value)}
            className="p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          <select
            value={imageCategory}
            onChange={(e) => setImageCategory(e.target.value)}
            className="p-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="general">General</option>
            <option value="events">Events</option>
            <option value="community">Community</option>
            <option value="awards">Awards</option>
            <option value="profile">Profile</option>
          </select>
          
          <div className="border-2 border-dashed border-blue-300 rounded-xl text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleGalleryUpload(file);
                  e.target.value = '';
                }
              }}
              className="hidden"
              id="gallery-upload"
              disabled={uploading}
            />
            <label htmlFor="gallery-upload" className="cursor-pointer block p-3">
              {uploading ? (
                <div className="space-y-2">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-blue-600 font-medium text-sm">Uploading... {uploadProgress}%</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-blue-600 font-medium text-sm">Upload Image</p>
                </>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-xl font-medium capitalize whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category} {category !== 'all' && `(${gallery.filter(item => item.category === category).length})`}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredGallery.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
            <Image className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>No images found in {selectedCategory} category</p>
          </div>
        ) : (
          filteredGallery.map(item => (
            <div key={item._id} className="relative group">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-24 sm:h-32 object-cover rounded-xl shadow-sm"
                onError={(e) => {
                  console.error('Error loading gallery image:', item.image);
                  e.target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all rounded-xl flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => deleteGalleryItem(item._id)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  title="Delete Image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                <p className="text-xs text-gray-500 capitalize">{item.category}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;