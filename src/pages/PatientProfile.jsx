import React, { useState, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import { User, Save, X, Phone, Calendar, Camera, Stethoscope, Check, Scale, Droplets, AlertTriangle } from 'lucide-react';

const PatientProfile = ({ isOpen, onClose }) => {
  const { user, updateProfile, fetchDoctors, assignDoctor } = useHealth();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    weight: '',
    bloodGroup: '',
    allergies: '',
    bio: '',
    phone: '',
    profilePicture: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [previewImage, setPreviewImage] = useState('');

  // Doctor selection state
  const [doctors, setDoctors] = useState([]);
  const [showDoctorList, setShowDoctorList] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age || '',
        weight: user.weight || '',
        bloodGroup: user.bloodGroup || '',
        allergies: user.allergies ? user.allergies.join(', ') : '',
        bio: user.bio || '',
        phone: user.phone || '',
        profilePicture: user.profilePicture || '',
      });
      setPreviewImage(user.profilePicture || '');
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData({ ...formData, profilePicture: base64String });
        setPreviewImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const profileData = {
        ...formData,
        allergies: formData.allergies.split(',').map(item => item.trim()).filter(item => item)
      };
      await updateProfile(profileData);
      setMessage('Profile updated successfully!');
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      setMessage('Error updating profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleShowDoctors = async () => {
    setShowDoctorList(true);
    setLoadingDoctors(true);
    try {
      const data = await fetchDoctors();
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleAssignDoctor = async (doctorId) => {
    try {
      await assignDoctor(doctorId);
      setMessage('Doctor assigned successfully!');
      setShowDoctorList(false);
    } catch (error) {
      setMessage('Error assigning doctor: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-2xl p-8 m-4 animate-fadeIn border border-white/20 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl">
              <User className="w-6 h-6 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Patient Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${message.includes('Error') || message.includes('size') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* Assigned Doctor Section */}
        <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            My Doctor
          </h3>

          {user?.assignedDoctor ? (
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                {user.assignedDoctor.profilePicture ? (
                  <img src={user.assignedDoctor.profilePicture} alt={user.assignedDoctor.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    Dr
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-800">{user.assignedDoctor.name}</h4>
                  <p className="text-sm text-slate-500">{user.assignedDoctor.specialization}</p>
                </div>
              </div>
              <button
                onClick={handleShowDoctors}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium px-3 py-1.5 hover:bg-teal-50 rounded-lg transition-colors"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-500 mb-3">No doctor assigned yet</p>
              <button
                onClick={handleShowDoctors}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                Choose a Doctor
              </button>
            </div>
          )}

          {/* Doctor List Modal Overlay */}
          {showDoctorList && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <h4 className="font-medium text-slate-700 mb-3">Available Doctors</h4>
              {loadingDoctors ? (
                <div className="text-center py-4 text-slate-500">Loading doctors...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {doctors.map(doc => (
                    <div key={doc._id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-300 cursor-pointer transition-all" onClick={() => handleAssignDoctor(doc._id)}>
                      {doc.profilePicture ? (
                        <img src={doc.profilePicture} alt={doc.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                          Dr
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{doc.name}</p>
                        <p className="text-xs text-slate-500 truncate">{doc.specialization}</p>
                      </div>
                      {user?.assignedDoctor?._id === doc._id && (
                        <Check className="w-4 h-4 text-teal-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowDoctorList(false)}
                className="mt-3 text-sm text-slate-500 hover:text-slate-700 w-full text-center"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center shadow-lg">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-teal-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-gradient-to-r from-teal-500 to-cyan-600 text-white p-2 rounded-full cursor-pointer hover:shadow-lg transition-all">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-2">Click camera icon to upload (Max 2MB)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Age
              </label>
              <input
                type="number"
                name="age"
                min="0"
                max="120"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Weight (kg)
              </label>
              <input
                type="number"
                name="weight"
                min="0"
                max="300"
                value={formData.weight}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="70"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                Blood Group
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white"
              >
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Allergies
              </label>
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="Peanuts, Penicillin..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bio / Medical Notes
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none"
              placeholder="Any specific medical conditions or notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientProfile;
