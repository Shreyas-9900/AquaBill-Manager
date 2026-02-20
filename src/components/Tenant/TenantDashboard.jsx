// src/components/Tenant/TenantDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { FaHome, FaSignOutAlt, FaCalendar, FaMoneyBillWave } from 'react-icons/fa';
import { FaDroplet } from 'react-icons/fa6';
import toast from 'react-hot-toast';
import PaymentModal from './PaymentModal';
import ChatButton from '../Chat/ChatButton';

const TenantDashboard = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [flatData, setFlatData] = useState(null);
  const [propertyData, setPropertyData] = useState(null);
  const [ownerData, setOwnerData] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    if (userProfile?.flatId) {
      fetchFlatData();
      fetchBills();
    } else {
      setLoading(false);
    }
  }, [userProfile]);

  const fetchFlatData = async () => {
    try {
      // Fetch flat data
      const flatDoc = await getDoc(doc(db, 'flats', userProfile.flatId));
      if (flatDoc.exists()) {
        const flat = { id: flatDoc.id, ...flatDoc.data() };
        setFlatData(flat);

        // Fetch property data
        const propertyDoc = await getDoc(doc(db, 'properties', flat.propertyId));
        if (propertyDoc.exists()) {
          const property = { id: propertyDoc.id, ...propertyDoc.data() };
          setPropertyData(property);

          // Fetch owner data
          const ownerDoc = await getDoc(doc(db, 'users', property.ownerId));
          if (ownerDoc.exists()) {
            setOwnerData(ownerDoc.data());
          }
        }
      }
    } catch (error) {
      console.error('Error fetching flat data:', error);
      toast.error('Failed to load flat details');
    }
  };

  const fetchBills = async () => {
    try {
      const billsQuery = query(
        collection(db, 'waterReadings'),
        where('flatId', '==', userProfile.flatId)
      );
      const billsSnapshot = await getDocs(billsQuery);
      const billsData = billsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      billsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBills(billsData);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handlePayment = (bill) => {
    setSelectedBill(bill);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedBill(null);
    fetchBills();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userProfile?.flatId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaHome className="text-orange-600 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Flat Assigned</h2>
          <p className="text-gray-600 mb-6">Please contact your property owner</p>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const totalBills = bills.length;
  const pendingAmount = bills
    .filter(bill => bill.status === 'pending')
    .reduce((sum, bill) => sum + bill.billAmount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                <FaDroplet className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tenant Dashboard</h1>
                <p className="text-sm text-gray-600">{userProfile?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Chat Button */}
              {flatData && ownerData && (
                <ChatButton 
                  flatId={userProfile.flatId}
                  otherUser={ownerData}
                />
              )}
              {/* Logout Button */}
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
        {/* Flat Info Card */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-lg p-6 text-white mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-100 mb-1">Your Flat</p>
              <h2 className="text-4xl font-bold mb-2">Flat {flatData?.flatNumber}</h2>
              <p className="text-lg">{propertyData?.name}</p>
              <p className="text-blue-100 text-sm">{propertyData?.address}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm mb-1">Flat Code</p>
              <code className="bg-white bg-opacity-20 px-3 py-1.5 rounded-lg font-mono text-lg">
                {flatData?.flatCode}
              </code>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Bills</p>
                <p className="text-3xl font-bold text-gray-900">{totalBills}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FaHome className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Pending Amount</p>
                <p className="text-3xl font-bold text-orange-600">₹{pendingAmount.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <FaMoneyBillWave className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Water Rate</p>
                <p className="text-3xl font-bold text-cyan-600">₹{propertyData?.waterRatePerUnit}/unit</p>
              </div>
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                <FaDroplet className="text-cyan-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Water Bills</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
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
                        <div>
                          <p className="font-semibold text-gray-900">{bill.billMonth}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(bill.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{bill.previousReading}</td>
                      <td className="px-6 py-4 text-gray-700">{bill.currentReading}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-blue-600">{bill.unitsConsumed} units</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">₹{bill.billAmount.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {bill.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {bill.status === 'pending' ? (
                          <button
                            onClick={() => handlePayment(bill)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            Pay Now
                          </button>
                        ) : (
                          <span className="text-green-600 font-medium">✓ Paid</span>
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
      {showPaymentModal && selectedBill && (
        <PaymentModal
          bill={selectedBill}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedBill(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default TenantDashboard;
