import React, { useState } from 'react';
import { useHealth } from '../context/HealthContext';
import { PlusCircle, Save, X } from 'lucide-react';

const InputForm = () => {
  const { addReading } = useHealth();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    heartRate: '',
    bloodPressureSys: '',
    bloodPressureDia: '',
    oxygenSaturation: '',
    bodyTemperature: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addReading({
      heartRate: Number(formData.heartRate),
      bloodPressureSys: Number(formData.bloodPressureSys),
      bloodPressureDia: Number(formData.bloodPressureDia),
      oxygenSaturation: Number(formData.oxygenSaturation),
      bodyTemperature: Number(formData.bodyTemperature),
    });
    setIsOpen(false);
    setFormData({
      heartRate: '',
      bloodPressureSys: '',
      bloodPressureDia: '',
      oxygenSaturation: '',
      bodyTemperature: '',
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-4 rounded-2xl shadow-2xl hover:shadow-teal-500/50 hover:scale-105 transition-all flex items-center gap-2 z-50 font-semibold"
      >
        <PlusCircle className="w-6 h-6" />
        <span>Add Vitals</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md p-8 m-4 animate-fadeIn border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Record Vitals
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Heart Rate (BPM)</label>
              <input
                type="number"
                name="heartRate"
                required
                min="30"
                max="250"
                value={formData.heartRate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="72"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">O2 Saturation (%)</label>
              <input
                type="number"
                name="oxygenSaturation"
                required
                min="50"
                max="100"
                value={formData.oxygenSaturation}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="98"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">BP Systolic</label>
              <input
                type="number"
                name="bloodPressureSys"
                required
                min="50"
                max="250"
                value={formData.bloodPressureSys}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="120"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">BP Diastolic</label>
              <input
                type="number"
                name="bloodPressureDia"
                required
                min="30"
                max="150"
                value={formData.bloodPressureDia}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="80"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Body Temp (°C)</label>
            <input
              type="number"
              name="bodyTemperature"
              required
              step="0.1"
              min="30"
              max="45"
              value={formData.bodyTemperature}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              placeholder="36.6"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mt-6"
          >
            <Save className="w-5 h-5" />
            Save Reading
          </button>
        </form>
      </div>
    </div>
  );
};

export default InputForm;
