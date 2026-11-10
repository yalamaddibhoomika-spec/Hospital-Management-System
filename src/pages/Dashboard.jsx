import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Heart, Activity, Thermometer, Droplets, AlertTriangle, TrendingUp, MessageSquare, CheckCircle, Download } from 'lucide-react';
import clsx from 'clsx';

const Dashboard = () => {
  const { currentVitals, readings, getStatus, user, suggestions, markSuggestionRead, downloadHealthReport } = useHealth();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      // Download last 30 days by default
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      await downloadHealthReport(startDate, endDate);
    } catch (error) {
      alert('Failed to download report: ' + error.message);
    } finally {
      setDownloading(false);
    }
  };

  // If user is logging out or not authenticated, don't show loading state
  if (!user) return null;

  if (!currentVitals) return (
    <div className="p-8 text-center">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
        <p className="text-slate-600">Loading vitals...</p>
      </div>
    </div>
  );

  // Use doctor from currentVitals (real-time) or fallback to user profile
  const assignedDoctor = currentVitals.assignedDoctor || user?.assignedDoctor;
  const showDoctor = assignedDoctor && typeof assignedDoctor === 'object' && assignedDoctor.name;

  const cards = [
    // ... cards definition ...
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl">
        {/* ... background blobs ... */}

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name || currentVitals.name || 'User'}! 👋</h2>
            <p className="text-indigo-100 text-lg max-w-xl">
              Here's your health overview for today. Your vitals are being monitored in real-time.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch gap-4">
            {/* Assigned Doctor Card */}
            {showDoctor && (
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 min-w-[200px]">
                {assignedDoctor.profilePicture ? (
                  <img
                    src={assignedDoctor.profilePicture}
                    alt="Doctor"
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                  />
                ) : (
                  <div className="p-3 bg-white/20 rounded-full">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">My Doctor</p>
                  <p className="font-bold text-white">Dr. {assignedDoctor.name}</p>
                  <p className="text-xs text-indigo-100">{assignedDoctor.specialization || 'General'}</p>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>

      {/* Doctor's Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-teal-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-teal-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Doctor's Advice</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.filter(s => !s.isRead).map((suggestion) => (
              <div key={suggestion._id} className={clsx(
                "p-4 rounded-xl border transition-all hover:shadow-md",
                suggestion.priority === 'Critical' ? "bg-red-50 border-red-200" :
                  suggestion.priority === 'High' ? "bg-orange-50 border-orange-200" :
                    "bg-teal-50 border-teal-200"
              )}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {suggestion.doctor?.profilePicture ? (
                      <img src={suggestion.doctor.profilePicture} alt="Dr" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-teal-600 border border-teal-100">
                        <Activity className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-800">Dr. {suggestion.doctor?.name}</p>
                      <p className="text-xs text-slate-500">{new Date(suggestion.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={clsx(
                    "px-2 py-1 rounded-full text-xs font-bold uppercase",
                    suggestion.priority === 'Critical' ? "bg-red-100 text-red-700" :
                      suggestion.priority === 'High' ? "bg-orange-100 text-orange-700" :
                        "bg-teal-100 text-teal-700"
                  )}>
                    {suggestion.priority}
                  </span>
                </div>
                <p className="text-slate-700 text-sm mb-3 pl-10">{suggestion.message}</p>
                <div className="flex justify-end">
                  <button
                    onClick={() => markSuggestionRead(suggestion._id)}
                    className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-teal-600 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Read
                  </button>
                </div>
              </div>
            ))}
            {suggestions.filter(s => !s.isRead).length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-500 italic">
                No new suggestions from your doctor.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ... rest of the dashboard ... */}

      {/* Vitals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={clsx(
              "group relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1",
              card.status === 'critical' ? 'ring-2 ring-red-400 shadow-red-200' :
                card.status === 'warning' ? 'ring-2 ring-orange-400 shadow-orange-200' : ''
            )}
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {/* Gradient overlay on hover */}
            <div className={clsx(
              "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br",
              card.gradient
            )} />

            <div className="relative flex justify-between items-start mb-4">
              <div className={clsx("p-3 rounded-xl shadow-md", card.iconBg)}>
                <card.icon className={clsx("w-6 h-6 bg-gradient-to-br bg-clip-text text-transparent", card.gradient)} />
              </div>
              {card.status !== 'normal' && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className={clsx(
                    "w-4 h-4",
                    card.status === 'critical' ? 'text-red-500 animate-pulse' : 'text-orange-500'
                  )} />
                  <span className={clsx(
                    "px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    card.status === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  )}>
                    {card.status}
                  </span>
                </div>
              )}
            </div>
            <div className="relative space-y-1">
              <h3 className="text-slate-600 text-sm font-medium">{card.title}</h3>
              <div className="flex items-baseline gap-2">
                <span className={clsx(
                  "text-4xl font-bold bg-gradient-to-br bg-clip-text text-transparent",
                  card.gradient
                )}>{card.value}</span>
                <span className="text-slate-400 text-sm font-medium">{card.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-gradient-to-br from-rose-100 to-pink-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
              Heart Rate History
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={readings}>
                <defs>
                  <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)'
                  }}
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                />
                <Area type="monotone" dataKey="heartRate" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorHr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Blood Pressure Trends
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={readings}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)'
                  }}
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                />
                <Line type="monotone" dataKey="bloodPressureSys" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} name="Systolic" />
                <Line type="monotone" dataKey="bloodPressureDia" stroke="#60a5fa" strokeWidth={3} strokeDasharray="5 5" dot={{ fill: '#60a5fa', r: 4 }} name="Diastolic" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Floating Export Button */}
      <button
        onClick={handleDownloadReport}
        disabled={downloading}
        className="fixed bottom-24 right-8 bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-4 rounded-2xl shadow-2xl hover:shadow-teal-500/50 hover:scale-105 transition-all flex items-center gap-2 z-50 font-semibold"
      >
        <Download className="w-6 h-6" />
        <span>{downloading ? 'Generating...' : 'Export Report'}</span>
      </button>
    </div>
  );
};

export default Dashboard;
