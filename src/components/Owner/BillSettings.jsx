// src/components/Owner/BillSettings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaArrowLeft, FaSave, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const BillSettings = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editingFlat, setEditingFlat] = useState(null);

  useEffect(() => {
    fetchPropertiesAndFlats();
  }, [currentUser]);

  const fetchPropertiesAndFlats = async () => {
    try {
      // Fetch properties
      const propertiesQuery = query(
        collection(db, 'properties'),
        where('ownerId', '==', currentUser.uid)
      );
      const propertiesSnapshot = await getDocs(propertiesQuery);
      const propertiesData = propertiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProperties(propertiesData);

      // Fetch all flats for these properties
      const allFlats = [];
      for (const property of propertiesData) {
        const flatsQuery = query(
          collection(db, 'flats'),
          where('propertyId', '==', property.id)
        );
        const flatsSnapshot = await getDocs(flatsQuery);
        flatsSnapshot.docs.forEach(flatDoc => {
          allFlats.push({
            id: flatDoc.id,
            propertyId: property.id,
            propertyName: property.name,
            ...flatDoc.data()
          });
        });
      }
      setFlats(allFlats);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProperty = async (propertyId, data) => {
    try {
      await updateDoc(doc(db, 'properties', propertyId), data);
      toast.success('Property settings updated!');
      setEditingProperty(null);
      fetchPropertiesAndFlats();
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('Failed to update property');
    }
  };

  const handleUpdateFlat = async (flatId, data) => {
    try {
      await updateDoc(doc(db, 'flats', flatId), data);
      toast.success('Flat settings updated!');
      setEditingFlat(null);
      fetchPropertiesAndFlats();
    } catch (error) {
      console.error('Error updating flat:', error);
      toast.error('Failed to update flat');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/owner')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft />
            <span>Back to Dashboard</span>
          </button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bill Settings</h1>
            <p className="text-gray-600 mt-1">Manage water rates and free allowances</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Property-Level Settings */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Settings</h2>
          <p className="text-gray-600 mb-6">Set default water rates for each property</p>

          <div className="space-y-4">
            {properties.map((property) => (
              <PropertySettingsCard
                key={property.id}
                property={property}
                isEditing={editingProperty === property.id}
                onEdit={() => setEditingProperty(property.id)}
                onCancel={() => setEditingProperty(null)}
                onSave={handleUpdateProperty}
              />
            ))}
          </div>
        </div>

        {/* Flat-Level Settings */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Flat-Level Free Water Allowances</h2>
          <p className="text-gray-600 mb-6">Set free water units for individual flats (overrides property defaults)</p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Property</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Flat</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tenant</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Free Water (units)</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {flats.map((flat) => (
                    <FlatSettingsRow
                      key={flat.id}
                      flat={flat}
                      isEditing={editingFlat === flat.id}
                      onEdit={() => setEditingFlat(flat.id)}
                      onCancel={() => setEditingFlat(null)}
                      onSave={handleUpdateFlat}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Property Settings Card Component
const PropertySettingsCard = ({ property, isEditing, onEdit, onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    waterRatePerUnit: property.waterRatePerUnit || 5,
    fixedCharge: property.fixedCharge || 50
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(property.id, formData);
  };

  if (!isEditing) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{property.name}</h3>
            <p className="text-sm text-gray-600">{property.propertyCode}</p>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <FaEdit />
            <span>Edit</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Water Rate</p>
            <p className="text-xl font-bold text-gray-900">₹{property.waterRatePerUnit}/unit</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fixed Charge</p>
            <p className="text-xl font-bold text-gray-900">₹{property.fixedCharge}/month</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border-2 border-blue-200">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">{property.name}</h3>
        <p className="text-sm text-gray-600">{property.propertyCode}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Water Rate (₹/unit)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.waterRatePerUnit}
            onChange={(e) => setFormData({ ...formData, waterRatePerUnit: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Fixed Charge (₹/month)
          </label>
          <input
            type="number"
            value={formData.fixedCharge}
            onChange={(e) => setFormData({ ...formData, fixedCharge: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            required
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <FaSave />
          Save Changes
        </button>
      </div>
    </form>
  );
};

// Flat Settings Row Component
const FlatSettingsRow = ({ flat, isEditing, onEdit, onCancel, onSave }) => {
  const [freeWaterUnits, setFreeWaterUnits] = useState(flat.freeWaterUnits || 0);

  const handleSubmit = () => {
    onSave(flat.id, { freeWaterUnits: parseFloat(freeWaterUnits) });
  };

  if (!isEditing) {
    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 text-gray-900">{flat.propertyName}</td>
        <td className="px-6 py-4 font-semibold text-gray-900">{flat.flatNumber}</td>
        <td className="px-6 py-4 text-gray-700">
          {flat.tenantId ? (
            <span className="text-green-600">Occupied</span>
          ) : (
            <span className="text-gray-400 italic">Vacant</span>
          )}
        </td>
        <td className="px-6 py-4">
          <span className="font-semibold text-gray-900">{flat.freeWaterUnits || 0} units</span>
        </td>
        <td className="px-6 py-4 text-right">
          <button
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-blue-50">
      <td className="px-6 py-4 text-gray-900">{flat.propertyName}</td>
      <td className="px-6 py-4 font-semibold text-gray-900">{flat.flatNumber}</td>
      <td className="px-6 py-4 text-gray-700">
        {flat.tenantId ? (
          <span className="text-green-600">Occupied</span>
        ) : (
          <span className="text-gray-400 italic">Vacant</span>
        )}
      </td>
      <td className="px-6 py-4">
        <input
          type="number"
          step="0.1"
          value={freeWaterUnits}
          onChange={(e) => setFreeWaterUnits(e.target.value)}
          className="w-32 px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="0"
        />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </td>
    </tr>
  );
};

export default BillSettings;
