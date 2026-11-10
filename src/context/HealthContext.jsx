import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';

const HealthContext = createContext();

export const useHealth = () => useContext(HealthContext);

const socket = io('http://localhost:5001'); // Connect to backend

export const HealthProvider = ({ children }) => {
  const [readings, setReadings] = useState([]);
  const [currentVitals, setCurrentVitals] = useState(null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [suggestions, setSuggestions] = useState([]);

  // Load User from token (fallback if user not in localStorage)
  useEffect(() => {
    if (token && !user) {
      const userId = JSON.parse(atob(token.split('.')[1])).id;
      setUser({ id: userId });
    }
  }, [token, user]);

  // Fetch initial data (history + profile)
  useEffect(() => {
    if (token) {
      // Fetch Health History
      fetch('http://localhost:5001/api/health', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setReadings(data.reverse());
          if (data.length > 0) {
            const latest = data[data.length - 1];
            // Merge assigned doctor from user profile if available
            if (user?.assignedDoctor) {
              latest.assignedDoctor = user.assignedDoctor;
            }
            setCurrentVitals(latest);
          }
        })
        .catch(err => console.error(err));

      // Fetch User Profile
      const fetchProfile = () => {
        fetch('http://localhost:5001/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data && !data.message) {
              setUser(data);
              localStorage.setItem('user', JSON.stringify(data));
            }
          })
          .catch(err => console.error('Error fetching profile:', err));
      };

      fetchProfile();
      fetchSuggestions();
    }
  }, [token]);

  // Fetch suggestions
  const fetchSuggestions = async () => {
    if (!token || !user) return;

    // Only fetch suggestions automatically for patients
    if (user.role !== 'patient') return;

    try {
      const res = await fetch('http://localhost:5001/api/suggestions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Force re-fetch if assignedDoctor is a string (stale data)
  useEffect(() => {
    if (token && user?.assignedDoctor && typeof user.assignedDoctor === 'string') {
      console.log('Detected stale assignedDoctor (string), fetching profile...');
      fetch('http://localhost:5001/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data && !data.message) {
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
          }
        })
        .catch(err => console.error('Error fetching profile:', err));
    }
  }, [user, token]);

  // Real-time updates
  useEffect(() => {
    socket.on('healthUpdate', (newReading) => {
      if (user && newReading.user === user.id) {
        setReadings(prev => [...prev, newReading]);

        const updatedVitals = { ...newReading };
        if (user.assignedDoctor) {
          updatedVitals.assignedDoctor = user.assignedDoctor;
        } else if (currentVitals?.assignedDoctor) {
          updatedVitals.assignedDoctor = currentVitals.assignedDoctor;
        }

        setCurrentVitals(updatedVitals);
      }
    });

    socket.on('newSuggestion', (suggestion) => {
      if (user?.role === 'patient' && suggestion.patient === user.id) {
        setSuggestions(prev => [suggestion, ...prev]);
      }
    });

    return () => {
      socket.off('healthUpdate');
      socket.off('newSuggestion');
    };
  }, [user, currentVitals]);

  const sendSuggestion = async (patientId, message, priority) => {
    try {
      const res = await fetch('http://localhost:5001/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ patientId, message, priority }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    } catch (error) {
      console.error('Error sending suggestion:', error);
      throw error;
    }
  };

  const markSuggestionRead = async (id) => {
    try {
      await fetch(`http://localhost:5001/api/suggestions/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuggestions(prev => prev.map(s => s._id === id ? { ...s, isRead: true } : s));
    } catch (error) {
      console.error('Error marking suggestion read:', error);
    }
  };

  const login = async (email, password) => {
    const res = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
    } else {
      throw new Error(data.message);
    }
  };

  const register = async (name, email, password, role = 'patient', specialization = '') => {
    const res = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, specialization }),
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
    } else {
      throw new Error(data.message);
    }
  };

  const addReading = async (newReading) => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5001/api/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newReading),
      });
      if (!res.ok) throw new Error('Failed to add reading');
    } catch (err) {
      console.error(err);
    }
  };

  const getStatus = (type, value) => {
    switch (type) {
      case 'heartRate':
        if (value < 60 || value > 100) return 'warning';
        if (value < 50 || value > 120) return 'critical';
        return 'normal';
      case 'oxygenSaturation':
        if (value < 95) return 'warning';
        if (value < 90) return 'critical';
        return 'normal';
      case 'bodyTemperature':
        if (value < 36 || value > 37.5) return 'warning';
        if (value < 35 || value > 39) return 'critical';
        return 'normal';
      case 'bloodPressureSys':
        if (value > 120 && value < 140) return 'warning';
        if (value >= 140) return 'critical';
        return 'normal';
      default:
        return 'normal';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setReadings([]);
    setCurrentVitals(null);
    setSuggestions([]);
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await fetch('http://localhost:5001/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/patient/doctors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) return data;
      throw new Error(data.message);
    } catch (error) {
      console.error('Fetch doctors error:', error);
      throw error;
    }
  };

  const assignDoctor = async (doctorId) => {
    try {
      const res = await fetch('http://localhost:5001/api/patient/assign-doctor', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ doctorId }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Assign doctor error:', error);
      throw error;
    }
  };

  // Download health report (for patients)
  const downloadHealthReport = async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`http://localhost:5001/api/pdf/health-report?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HealthNexus_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorText = await res.text();
        console.error('Download failed:', res.status, errorText);
        throw new Error(`Failed to generate report: ${res.status} ${res.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('Download report error:', error);
      throw error;
    }
  };

  // Download patient report (for doctors)
  const downloadPatientReport = async (patientId, startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`http://localhost:5001/api/pdf/patient-report/${patientId}?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HealthNexus_Patient_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to generate patient report');
      }
    } catch (error) {
      console.error('Download patient report error:', error);
      throw error;
    }
  };

  return (
    <HealthContext.Provider value={{
      readings,
      currentVitals,
      addReading,
      getStatus,
      user,
      login,
      register,
      logout,
      updateProfile,
      fetchDoctors,
      assignDoctor,
      suggestions,
      sendSuggestion,
      markSuggestionRead,
      downloadHealthReport,
      downloadPatientReport
    }}>
      {children}
    </HealthContext.Provider>
  );
};
