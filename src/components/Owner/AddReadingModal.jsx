// src/components/Owner/AddReadingModal.jsx
import React, { useState } from 'react';
import { FaTimes, FaCalendarAlt } from 'react-icons/fa';

const AddReadingModal = ({ onClose, onSubmit, flat }) => {
  const [formData, setFormData] = useState({
    currentReading: '',
    billMonth: getCurrentMonth()
  });
  const [showCalendar, setShowCalendar] = useState(false);

  function getCurrentMonth() {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMonthSelect = (month, year) => {
    setFormData({ ...formData, billMonth: `${month} ${year}` });
    setShowCalendar(false);
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
            <div className="relative">
              <input
                type="text"
                name="billMonth"
                value={formData.billMonth}
                onChange={handleChange}
                placeholder="Select month"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none pr-10"
                readOnly
                onClick={() => setShowCalendar(!showCalendar)}
              />
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
              >
                <FaCalendarAlt />
              </button>
            </div>

            {/* Month Picker Calendar */}
            {showCalendar && (
              <MonthPicker
                onSelect={handleMonthSelect}
                onClose={() => setShowCalendar(false)}
              />
            )}
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

// Month Picker Component
const MonthPicker = ({ onSelect, onClose }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
      {/* Year Selector */}
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={() => setSelectedYear(selectedYear - 1)}
          className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
        >
          ‹
        </button>
        <span className="font-semibold text-gray-900">{selectedYear}</span>
        <button
          type="button"
          onClick={() => setSelectedYear(selectedYear + 1)}
          className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
        >
          ›
        </button>
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-3 gap-2">
        {months.map((month) => (
          <button
            key={month}
            type="button"
            onClick={() => onSelect(month, selectedYear)}
            className="px-3 py-2 text-sm rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            {month}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AddReadingModal;
