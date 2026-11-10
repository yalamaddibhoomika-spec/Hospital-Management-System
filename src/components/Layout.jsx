import React, { useState } from 'react';
import { Activity, LogOut, UserCircle } from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import DoctorProfile from '../pages/DoctorProfile';
import PatientProfile from '../pages/PatientProfile';
import clsx from 'clsx';

const Layout = ({ children }) => {
  const { user, logout } = useHealth();
  const [showProfile, setShowProfile] = useState(false);

  // Get initials from user name
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen text-slate-900 font-sans bg-slate-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <header className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-10 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="HealthNexus"
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              HealthNexus
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-medium">
                  {user?.role === 'doctor' ? 'Dr.' : 'Patient:'} {user?.name || 'User'}
                </span>
                <span className={clsx(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm",
                  user?.role === 'doctor' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' : 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white'
                )}>
                  {user?.role || 'patient'}
                </span>
              </div>
              {user?.role === 'doctor' && user?.specialization && (
                <span className="text-xs text-slate-500 mt-0.5">
                  {user.specialization}
                </span>
              )}
              {user?.role === 'patient' && user?.assignedDoctor && (
                <span className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <span className="text-slate-400">Dr.</span> {user.assignedDoctor.name}
                </span>
              )}
            </div>

            {/* Profile Picture or Initials */}
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover shadow-lg ring-2 ring-white"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {getInitials(user?.name)}
              </div>
            )}

            <button
              onClick={() => setShowProfile(true)}
              className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all hover:shadow-md"
              title="Edit Profile"
            >
              <UserCircle className="w-5 h-5" />
            </button>

            <button
              onClick={logout}
              className="p-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all hover:shadow-md"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {user?.role === 'doctor' && (
        <DoctorProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
      )}
      {user?.role === 'patient' && (
        <PatientProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

export default Layout;
