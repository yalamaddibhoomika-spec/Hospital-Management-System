import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Activity, User, Calendar, Droplets, AlertTriangle } from 'lucide-react';

const VerifyReport = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/patient/public/${id}`);
        const data = await res.json();

        if (res.ok) {
          setPatient(data);
        } else {
          setError(data.message || 'Verification failed');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPatient();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Verification Failed</h2>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-8 text-center text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Verified Patient</h1>
          <p className="text-teal-100 text-sm">HealthNexus Verification System</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-800">{patient.name}</h2>
            <p className="text-slate-500 text-sm">Member since {new Date(patient.memberSince).getFullYear()}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <User className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Age</p>
                <p className="font-semibold text-slate-800">{patient.age || 'N/A'} years</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Droplets className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Blood Group</p>
                <p className="font-semibold text-slate-800">{patient.bloodGroup || 'Not specified'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Assigned Doctor</p>
                <p className="font-semibold text-slate-800">{patient.doctor}</p>
              </div>
            </div>

            {patient.allergies && patient.allergies.length > 0 && (
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">Allergies</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((allergy, index) => (
                    <span key={index} className="px-2 py-1 bg-white text-orange-600 text-xs font-medium rounded-md border border-orange-100">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              This verification confirms that the patient exists in the HealthNexus system.
              For full medical history, please request a complete health report.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyReport;
