// src/components/Tenant/TenantDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaHome, FaSignOutAlt, FaCalendar, FaMoneyBillWave } from 'react-icons/fa';
import { FaDroplet } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PaymentModal from './PaymentModal';

const TenantDashboard = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [flat, setFlat] = useState(null);
  const [property, setProperty] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    fetchTenantData();
  }, [currentUser]);

  const fetchTenantData = async () => {
    try {
      // Find flat where tenant is assigned
      const flatsQuery = query(
        collection(db, 'flats'),
        where('tenantId', '==', currentUser.uid)
      );
      const flatsSnapshot = await getDocs(flatsQuery);
      
      if (flatsSnapshot.empty) {
        toast.error('No flat assigned to your account');
        setLoading(false);
        return;
      }

      const flatData = { id: flatsSnapshot.docs[0].id, ...flatsSnapshot.docs[0].data() };
      setFlat(flatData);

      // Fetch property details
      const propertyDoc = await getDoc(doc(db, 'properties', flatData.propertyId));
      if (propertyDoc.exists()) {
        setProperty({ id: propertyDoc.id, ...propertyDoc.data() });
      }

      // Fetch water bills
      const billsQuery = query(
        collection(db, 'waterReadings'),
        where('flatId', '==', flatData.id)
      );
      const billsSnapshot = await getDocs(billsQuery);
      const billsData = billsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setBills(billsData);
    } catch (error) {
      console.error('Error fetching tenant data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
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

  const handlePayClick = (bill) => {
    setSelectedBill(bill);
    setShowPayment(true);
  };

  const totalPending = bills
    .filter(b => b.status === 'pending')
    .reduce((sum, b) => sum + b.billAmount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!flat) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaHome className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Flat Assigned</h2>
          <p className="text-gray-600 mb-4">Please contact your property owner</p>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
                <FaDroplet className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tenant Dashboard</h1>
                <p className="text-sm text-gray-600">{userProfile?.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FaSignOutAlt className="text-lg" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Flat Info Card */}
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 text-white mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Your Flat</p>
              <h2 className="text-3xl font-bold mb-2">Flat {flat.flatNumber}</h2>
              <p className="text-blue-100">{property?.name}</p>
              <p className="text-blue-100 text-sm">{property?.address}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm mb-1">Flat Code</p>
              <p className="text-xl font-mono bg-white/20 px-4 py-2 rounded-lg">
                {flat.flatCode}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Bills</p>
                <p className="text-3xl font-bold text-gray-900">{bills.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FaCalendar className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Pending Amount</p>
                <p className="text-3xl font-bold text-orange-600">₹{totalPending.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <FaMoneyBillWave className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Water Rate</p>
                <p className="text-3xl font-bold text-gray-900">₹{property?.waterRatePerUnit}/unit</p>
              </div>
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                <FaDroplet className="text-cyan-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Bills List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Water Bills</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Month</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Previous</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Current</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Consumed</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No bills generated yet
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{bill.billMonth}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(bill.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{bill.previousReading}</td>
                      <td className="px-6 py-4 text-gray-700">{bill.currentReading}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-blue-600">{bill.unitsConsumed} units</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 text-lg">₹{bill.billAmount.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {bill.status === 'paid' ? (
                          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {bill.status === 'pending' && (
                          <button
                            onClick={() => handlePayClick(bill)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Pay Now
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          bill={selectedBill}
          onClose={() => {
            setShowPayment(false);
            setSelectedBill(null);
          }}
          onSuccess={() => {
            setShowPayment(false);
            setSelectedBill(null);
            fetchTenantData();
          }}
        />
      )}
    </div>
  );
};

export default TenantDashboard;
