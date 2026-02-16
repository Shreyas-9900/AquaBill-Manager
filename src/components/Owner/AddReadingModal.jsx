// src/components/Owner/AddReadingModal.jsx
import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

const AddReadingModal = ({ onClose, onSubmit, flat }) => {
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  
  const [formData, setFormData] = useState({
    currentReading: '',
    billMonth: currentMonth
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      currentReading: parseFloat(formData.currentReading)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <FaTimes className="text-xl" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Water Reading</h2>
        <p className="text-gray-600 mb-6">Flat {flat?.flatNumber}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {flat?.latestReading && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600">Previous Reading</p>
              <p className="text-2xl font-bold text-gray-900">
                {flat.latestReading.currentReading} units
              </p>
              <p className="text-xs text-gray-500 mt-1">{flat.latestReading.billMonth}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Current Meter Reading (units)
            </label>
            <input
              type="number"
              name="currentReading"
              value={formData.currentReading}
              onChange={handleChange}
              placeholder="Enter meter reading"
              min={flat?.latestReading?.currentReading || 0}
              step="0.01"
              required
              className="w-full px-4 py-3 text-lg rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bill Month
            </label>
            <input
              type="text"
              name="billMonth"
              value={formData.billMonth}
              onChange={handleChange}
              placeholder="Jan-2024"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Add Reading & Generate Bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReadingModal;
