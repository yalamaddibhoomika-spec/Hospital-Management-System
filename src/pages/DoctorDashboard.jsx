import React, { useState, useEffect } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  LayoutDashboard, Users, Calendar, FileText, Settings, LogOut,
  Search, Bell, ChevronRight, Clock, Save, Stethoscope, Phone, Award, Camera,
  MessageSquare, Send, X, Activity, AlertTriangle, User, Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';

const DoctorDashboard = () => {
  const { user, logout, updateProfile, sendSuggestion, downloadPatientReport } = useHealth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    specialization: '',
    bio: '',
    phone: '',
    licenseNumber: '',
    yearsOfExperience: '',
    profilePicture: '',
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');

  // Suggestion State
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionData, setSuggestionData] = useState({ patientId: '', patientName: '', message: '', priority: 'Normal' });
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);

  const handleDownloadReport = async (patientId) => {
    try {
      setDownloadingReport(true);
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      await downloadPatientReport(patientId, startDate, endDate);
    } catch (error) {
      alert('Failed to download report: ' + error.message);
    } finally {
      setDownloadingReport(false);
    }
  };

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAllPatients();
  }, []);

  // Initialize settings form when user data is available
  useEffect(() => {
    if (user) {
      setSettingsForm({
        name: user.name || '',
        specialization: user.specialization || '',
        bio: user.bio || '',
        phone: user.phone || '',
        licenseNumber: user.licenseNumber || '',
        yearsOfExperience: user.yearsOfExperience || '',
        profilePicture: user.profilePicture || '',
      });
    }
  }, [user]);

  const fetchAllPatients = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/doctor/patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('Fetched Patients Data:', data); // Debug log
      setPatients(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setLoading(false);
    }
  };

  // Generate notifications based on patient vitals
  useEffect(() => {
    if (patients.length > 0) {
      const newNotifications = [];
      patients.forEach(patient => {
        if (patient.latestVitals) {
          // Only suppress alerts if advice was sent AFTER the vital reading
          // This means: NEW vitals will ALWAYS show alerts, but OLD vitals won't reappear
          if (patient.lastAdviceSentAt) {
            const adviceTime = new Date(patient.lastAdviceSentAt);
            const vitalTime = new Date(patient.latestVitals.timestamp);

            console.log(`[Alert Check] Patient: ${patient.name}`);
            console.log(`- Last Advice: ${adviceTime.toLocaleTimeString()}`);
            console.log(`- Latest Vital: ${vitalTime.toLocaleTimeString()}`);

            // If advice was sent AFTER this vital reading, skip the alert
            // (it means we already addressed this specific reading)
            if (adviceTime > vitalTime) {
              console.log('-> SKIPPING ALERT (Already Addressed)');
              return; // Skip this patient's alerts
            } else {
              console.log('-> SHOWING ALERT (New Vital After Advice)');
            }
          } else {
            console.log(`[Alert Check] Patient: ${patient.name} - No lastAdviceSentAt found.`);
          }

          const { heartRate, bloodPressureSys, oxygenSaturation, bodyTemperature, timestamp } = patient.latestVitals;
          const alertTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          if (heartRate > 100 || heartRate < 60) {
            newNotifications.push({
              id: `hr-${patient._id}`,
              type: 'warning',
              message: `Abnormal Heart Rate for ${patient.name}: ${heartRate} bpm`,
              time: alertTime
            });
          }
          if (bloodPressureSys > 140) {
            newNotifications.push({
              id: `bp-${patient._id}`,
              type: 'critical',
              message: `High Blood Pressure for ${patient.name}: ${bloodPressureSys} mmHg`,
              time: alertTime
            });
          }
          if (oxygenSaturation < 95) {
            newNotifications.push({
              id: `o2-${patient._id}`,
              type: 'critical',
              message: `Low Oxygen for ${patient.name}: ${oxygenSaturation}%`,
              time: alertTime
            });
          }
        }
      });
      setNotifications(newNotifications);
    }
  }, [patients]);

  const fetchPatientHistory = async (patientId) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5001/api/doctor/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPatientHistory(data);
      setSelectedPatient(patientId);
      setActiveTab('patient_details');
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patient history:', error);
      setLoading(false);
    }
  };

  const handleSettingsChange = (e) => {
    setSettingsForm({ ...settingsForm, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setSettingsMessage('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsForm({ ...settingsForm, profilePicture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMessage('');
    try {
      await updateProfile(settingsForm);
      setSettingsMessage('Profile updated successfully!');
    } catch (error) {
      setSettingsMessage('Error updating profile: ' + error.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const openSuggestionModal = (patientId, patientName) => {
    setSuggestionData({ patientId, patientName, message: '', priority: 'Normal' });
    setShowSuggestionModal(true);
    setShowNotifications(false); // Close notifications if open
  };
  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    setSuggestionLoading(true);
    try {
      await sendSuggestion(suggestionData.patientId, suggestionData.message, suggestionData.priority);

      // Update local state to reflect that advice was sent (so alert disappears immediately)
      setPatients(prev => prev.map(p =>
        p._id === suggestionData.patientId
          ? { ...p, lastAdviceSentAt: new Date().toISOString() }
          : p
      ));

      setShowSuggestionModal(false);
      alert('Suggestion sent successfully!');
    } catch (error) {
      alert('Failed to send suggestion: ' + error.message);
    } finally {
      setSuggestionLoading(false);
    }
  };

  const SidebarItem = ({ icon: Icon, label, id, active }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        if (id !== 'patient_details') setSelectedPatient(null);
      }}
      className={clsx(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
        active ? "bg-teal-50 text-teal-600" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col hidden md:flex">
        <div className="flex items-center gap-3 mb-10 px-2">
          <img
            src="/logo.png"
            alt="HealthNexus"
            className="w-10 h-10 object-contain"
          />
          <span className="text-lg font-bold tracking-wide text-slate-800">HEALTHNEXUS</span>
        </div>

        <div className="space-y-2 flex-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" id="dashboard" active={activeTab === 'dashboard'} />
          <SidebarItem icon={Users} label="Patients" id="patients" active={activeTab === 'patients'} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-slate-200 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 w-96">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patients..."
              className="bg-transparent border-none outline-none text-sm w-full placeholder-slate-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-800 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-800">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-sm">No new notifications</div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className={clsx("w-5 h-5 mt-0.5", notif.type === 'critical' ? "text-red-500" : "text-orange-500")} />
                            <div className="flex-1">
                              <p className="text-sm text-slate-800">{notif.message}</p>
                              <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const patient = patients.find(p => notif.message.includes(p.name));
                                  if (patient) openSuggestionModal(patient._id, patient.name);
                                }}
                                className="mt-2 text-xs bg-teal-50 text-teal-600 px-2 py-1 rounded-md font-medium hover:bg-teal-100 transition-colors flex items-center gap-1 w-fit"
                              >
                                <MessageSquare className="w-3 h-3" />
                                Send Advice
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-800">Dr. {user?.name}</p>
                <p className="text-xs text-slate-500">{user?.specialization || 'General Doctor'}</p>
              </div>
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
              ) : (
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-teal-600">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {activeTab === 'patient_details' && patientHistory && (
            <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
              <button
                onClick={() => {
                  setActiveTab('patients');
                  setSelectedPatient(null);
                }}
                className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-4"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back to Patients
              </button>

              <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-6">
                  {patientHistory.patient.profilePicture ? (
                    <img src={patientHistory.patient.profilePicture} alt={patientHistory.patient.name} className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-50" />
                  ) : (
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-teal-600">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{patientHistory.patient.name}</h2>
                    <div className="flex gap-4 text-sm text-slate-500 mt-1">
                      <span>{patientHistory.patient.email}</span>
                      {patientHistory.patient.age && <span>• {patientHistory.patient.age} years old</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDownloadReport(patientHistory.patient._id)}
                    disabled={downloadingReport}
                    className="bg-white text-slate-600 border border-slate-200 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {downloadingReport ? 'Exporting...' : 'Export Report'}
                  </button>
                  <button
                    onClick={() => openSuggestionModal(patientHistory.patient._id, patientHistory.patient.name)}
                    className="bg-teal-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-teal-700 transition-all flex items-center gap-2 shadow-lg shadow-teal-200"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send Advice
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Heart Rate History</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[...patientHistory.readings].reverse()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        <Line type="monotone" dataKey="heartRate" stroke="#f43f5e" strokeWidth={3} dot={{ fill: '#f43f5e', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Blood Pressure History</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[...patientHistory.readings].reverse()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        <Line type="monotone" dataKey="bloodPressureSys" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} name="Systolic" />
                        <Line type="monotone" dataKey="bloodPressureDia" stroke="#60a5fa" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#60a5fa', r: 4 }} name="Diastolic" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800">Recent Readings</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-6 py-4">Time</th>
                        <th className="px-6 py-4">Heart Rate</th>
                        <th className="px-6 py-4">Blood Pressure</th>
                        <th className="px-6 py-4">O2 Saturation</th>
                        <th className="px-6 py-4">Temperature</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patientHistory.readings.map((reading, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-600">{new Date(reading.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4 font-medium text-slate-800">{reading.heartRate} bpm</td>
                          <td className="px-6 py-4 text-slate-600">{reading.bloodPressureSys}/{reading.bloodPressureDia} mmHg</td>
                          <td className="px-6 py-4 text-slate-600">{reading.oxygenSaturation}%</td>
                          <td className="px-6 py-4 text-slate-600">{reading.bodyTemperature}°C</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-slate-500 text-sm font-medium mb-1">Total Patients</p>
                      <h3 className="text-3xl font-bold text-slate-800">{patients.length}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <Users className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-emerald-600 font-medium">Active</span>
                    <span>assigned patients</span>
                  </div>
                </div>
              </div>

              {/* Patients Grid */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800">My Patients</h2>
                {filteredPatients.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 shadow-sm">
                    {searchTerm ? 'No patients found matching your search.' : 'No patients assigned yet.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient._id}
                        onClick={() => fetchPatientHistory(patient._id)}
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          {patient.profilePicture ? (
                            <img src={patient.profilePicture} alt={patient.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100" />
                          ) : (
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-teal-600">
                              <User className="w-6 h-6" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-slate-800 group-hover:text-teal-600 transition-colors">{patient.name}</h3>
                            <p className="text-sm text-slate-500">{patient.email}</p>
                            {patient.age && <p className="text-xs text-slate-400 mt-1">Age: {patient.age}</p>}
                          </div>
                        </div>
                        {patient.latestVitals ? (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <p className="text-slate-500 text-xs mb-1">Heart Rate</p>
                              <p className="font-semibold text-slate-800">{patient.latestVitals.heartRate} bpm</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <p className="text-slate-500 text-xs mb-1">Blood Pressure</p>
                              <p className="font-semibold text-slate-800">{patient.latestVitals.bloodPressureSys}/{patient.latestVitals.bloodPressureDia}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400 italic py-2">No readings available</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">All Patients</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient._id}
                    onClick={() => fetchPatientHistory(patient._id)}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {patient.profilePicture ? (
                        <img src={patient.profilePicture} alt={patient.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-teal-600">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-800 group-hover:text-teal-600 transition-colors">{patient.name}</h3>
                        <p className="text-sm text-slate-500">{patient.email}</p>
                      </div>
                    </div>
                    {patient.latestVitals ? (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-slate-500 text-xs mb-1">Heart Rate</p>
                          <p className="font-semibold text-slate-800">{patient.latestVitals.heartRate} bpm</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-slate-500 text-xs mb-1">Blood Pressure</p>
                          <p className="font-semibold text-slate-800">{patient.latestVitals.bloodPressureSys}/{patient.latestVitals.bloodPressureDia}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400 italic py-2">No readings available</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Suggestion Modal */}
      {showSuggestionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                Send Advice to {suggestionData.patientName}
              </h3>
              <button onClick={() => setShowSuggestionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSuggestionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={suggestionData.priority}
                  onChange={(e) => setSuggestionData({ ...suggestionData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  value={suggestionData.message}
                  onChange={(e) => setSuggestionData({ ...suggestionData, message: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                  placeholder="Enter your medical advice or suggestion..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSuggestionModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={suggestionLoading}
                  className="bg-teal-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-teal-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {suggestionLoading ? 'Sending...' : 'Send Advice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
