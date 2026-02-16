// src/components/Owner/OwnerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaBuilding, FaPlus, FaSignOutAlt, FaCog, FaExclamationCircle, FaHome } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AddPropertyModal from './AddPropertyModal';
import PropertyCard from './PropertyCard';

const OwnerDashboard = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [unpaidBillsCount, setUnpaidBillsCount] = useState(0);

  useEffect(() => {
    fetchProperties();
    fetchUnpaidBills();
  }, [currentUser]);

  const fetchProperties = async () => {
    try {
      const q = query(collection(db, 'properties'), where('ownerId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      const propertiesData = await Promise.all(
        querySnapshot.docs.map(async (propertyDoc) => {
          // Get flats count for each property
          const flatsQuery = query(
            collection(db, 'flats'),
            where('propertyId', '==', propertyDoc.id)
          );
          const flatsSnapshot = await getDocs(flatsQuery);
          
          const occupiedFlats = flatsSnapshot.docs.filter(
            doc => doc.data().tenantId
          ).length;

          return {
            id: propertyDoc.id,
            ...propertyDoc.data(),
            totalFlats: flatsSnapshot.size,
            occupiedFlats
          };
        })
      );

      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnpaidBills = async () => {
    try {
      // Get all properties owned by user
      const propertiesQuery = query(
        collection(db, 'properties'),
        where('ownerId', '==', currentUser.uid)
      );
      const propertiesSnapshot = await getDocs(propertiesQuery);
      const propertyIds = propertiesSnapshot.docs.map(doc => doc.id);

      // Count unpaid bills across all properties
      let unpaidCount = 0;
      for (const propertyId of propertyIds) {
        const billsQuery = query(
          collection(db, 'waterReadings'),
          where('propertyId', '==', propertyId),
          where('status', '==', 'pending')
        );
        const billsSnapshot = await getDocs(billsQuery);
        unpaidCount += billsSnapshot.size;
      }

      setUnpaidBillsCount(unpaidCount);
    } catch (error) {
      console.error('Error fetching unpaid bills:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleAddProperty = async (propertyData) => {
    try {
      await addDoc(collection(db, 'properties'), {
        ...propertyData,
        ownerId: currentUser.uid,
        createdAt: new Date().toISOString()
      });
      
      toast.success('Property added successfully!');
      setShowAddProperty(false);
      fetchProperties();
    } catch (error) {
      console.error('Error adding property:', error);
      toast.error('Failed to add property');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
                <FaHome className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
                <p className="text-sm text-gray-600">{userProfile?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/owner/bill-settings')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaCog className="text-lg" />
                <span className="hidden sm:inline">Bill Settings</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FaSignOutAlt className="text-lg" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Your Properties</h2>
            <p className="text-gray-600 mt-1">Manage your rental properties and water billing</p>
          </div>
          <button
            onClick={() => setShowAddProperty(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <FaPlus />
            <span>Add Property</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Properties</p>
                <p className="text-4xl font-bold text-gray-900">{properties.length}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <FaBuilding className="text-blue-600 text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Flats</p>
                <p className="text-4xl font-bold text-gray-900">
                  {properties.reduce((sum, p) => sum + p.totalFlats, 0)}
                </p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <FaHome className="text-green-600 text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Unpaid Bills</p>
                <p className="text-4xl font-bold text-gray-900">{unpaidBillsCount}</p>
              </div>
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                <FaExclamationCircle className="text-red-600 text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <FaBuilding className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties Yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first property</p>
            <button
              onClick={() => setShowAddProperty(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <FaPlus />
              <span>Add Your First Property</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onRefresh={fetchProperties}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Property Modal */}
      {showAddProperty && (
        <AddPropertyModal
          onClose={() => setShowAddProperty(false)}
          onSubmit={handleAddProperty}
        />
      )}
    </div>
  );
};

export default OwnerDashboard;
