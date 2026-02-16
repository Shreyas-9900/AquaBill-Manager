// src/components/Owner/PropertyCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBuilding, FaMapMarkerAlt, FaHome, FaChevronRight } from 'react-icons/fa';

const PropertyCard = ({ property, onRefresh }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/owner/property/${property.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <FaBuilding className="text-white text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {property.name}
            </h3>
            <p className="text-xs text-gray-500">{property.propertyCode}</p>
          </div>
        </div>
        <FaChevronRight className="text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FaMapMarkerAlt className="text-gray-400" />
          <span className="line-clamp-1">{property.address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FaHome className="text-gray-400" />
          <span>{property.totalFlats} flats • {property.occupiedFlats} occupied</span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Water Rate</span>
          <span className="font-semibold text-gray-900">₹{property.waterRatePerUnit}/unit</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-600">Fixed Charge</span>
          <span className="font-semibold text-gray-900">₹{property.fixedCharge}/month</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
