// src/components/Owner/PropertyDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaCopy, FaCheckCircle, FaPaperPlane } from 'react-icons/fa';
import toast from 'react-hot-toast';
import AddFlatModal from './AddFlatModal';
import AddReadingModal from './AddReadingModal';
import PaymentRequestModal from './PaymentRequestModal';

const PropertyDetails = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddFlat, setShowAddFlat] = useState(false);
  const [showAddReading, setShowAddReading] = useState(false);
  const [showPaymentRequest, setShowPaymentRequest] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedBillFlat, setSelectedBillFlat] = useState(null);

  useEffect(() => {
    fetchPropertyDetails();
    fetchFlats();
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
      if (propertyDoc.exists()) {
        setProperty({ id: propertyDoc.id, ...propertyDoc.data() });
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Failed to load property details');
    }
  };

  const fetchFlats = async () => {
    try {
      const q = query(collection(db, 'flats'), where('propertyId', '==', propertyId));
      const querySnapshot = await getDocs(q);
      
      const flatsData = await Promise.all(
        querySnapshot.docs.map(async (flatDoc) => {
          const flatData = { id: flatDoc.id, ...flatDoc.data() };
          
          // Get tenant info if exists
          if (flatData.tenantId) {
            const tenantDoc = await getDoc(doc(db, 'users', flatData.tenantId));
            if (tenantDoc.exists()) {
              flatData.tenant = tenantDoc.data();
            }
          }

          // Get latest reading
          const readingsQuery = query(
            collection(db, 'waterReadings'),
            where('flatId', '==', flatDoc.id)
          );
          const readingsSnapshot = await getDocs(readingsQuery);
          const readings = readingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          readings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          if (readings.length > 0) {
            flatData.latestReading = readings[0];
          }

          return flatData;
        })
      );

      setFlats(flatsData);
    } catch (error) {
      console.error('Error fetching flats:', error);
      toast.error('Failed to load flats');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFlat = async (flatData) => {
    try {
      const flatCode = `${property.propertyCode}-F${flatData.flatNumber}`;
      
      await addDoc(collection(db, 'flats'), {
        ...flatData,
        propertyId,
        flatCode,
        createdAt: new Date().toISOString()
      });

      toast.success('Flat added successfully!');
      setShowAddFlat(false);
      fetchFlats();
    } catch (error) {
      console.error('Error adding flat:', error);
      toast.error('Failed to add flat');
    }
  };

  const handleDeleteFlat = async (flatId) => {
    if (!window.confirm('Are you sure you want to delete this flat?')) return;

    try {
      await deleteDoc(doc(db, 'flats', flatId));
      toast.success('Flat deleted successfully!');
      fetchFlats();
    } catch (error) {
      console.error('Error deleting flat:', error);
      toast.error('Failed to delete flat');
    }
  };

  const handleCopyFlatCode = (flatCode) => {
    navigator.clipboard.writeText(flatCode);
    toast.success('Flat code copied!');
  };

  const handleAddReading = async (readingData) => {
    try {
      const flat = flats.find(f => f.id === selectedFlat);
      const previousReading = flat.latestReading?.currentReading || 0;
      const totalUnitsConsumed = readingData.currentReading - previousReading;
      
      // Apply free water allowance
      const freeWaterUnits = flat.freeWaterUnits || 0;
      const billableUnits = Math.max(0, totalUnitsConsumed - freeWaterUnits);
      
      const billAmount = (billableUnits * property.waterRatePerUnit) + property.fixedCharge;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15);

      await addDoc(collection(db, 'waterReadings'), {
        flatId: selectedFlat,
        propertyId,
        previousReading,
        currentReading: readingData.currentReading,
        unitsConsumed: totalUnitsConsumed,
        freeWaterUnits: freeWaterUnits,
        billableUnits: billableUnits,
        billAmount,
        billMonth: readingData.billMonth,
        status: 'pending',
        dueDate: dueDate.toISOString(),
        createdAt: new Date().toISOString()
      });

      toast.success('Water reading added successfully!');
      setShowAddReading(false);
      setSelectedFlat(null);
      fetchFlats();
    } catch (error) {
      console.error('Error adding reading:', error);
      toast.error('Failed to add reading');
    }
  };

  const handleEditBill = async (billId, flat) => {
    const newAmount = prompt('Enter new bill amount (₹):', flat.latestReading.billAmount);
    
    if (newAmount && !isNaN(newAmount)) {
      try {
        await updateDoc(doc(db, 'waterReadings', billId), {
          billAmount: parseFloat(newAmount),
          updatedAt: new Date().toISOString()
        });
        toast.success('Bill updated successfully!');
        fetchFlats();
      } catch (error) {
        console.error('Error updating bill:', error);
        toast.error('Failed to update bill');
      }
    }
  };

  const handleDeleteBill = async (billId) => {
    if (!window.confirm('Are you sure you want to delete this bill? This action cannot be undone.')) return;
    
    try {
      await deleteDoc(doc(db, 'waterReadings', billId));
      toast.success('Bill deleted successfully!');
      fetchFlats();
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.error('Failed to delete bill');
    }
  };

  const handleRequestPayment = (flat) => {
    setSelectedBill(flat.latestReading);
    setSelectedBillFlat(flat);
    setShowPaymentRequest(true);
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/owner')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft />
            <span>Back to Properties</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{property?.name}</h1>
              <p className="text-gray-600 mt-1">{property?.address}</p>
            </div>
            <button
              onClick={() => setShowAddFlat(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md"
            >
              <FaPlus />
              <span>Add Flat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Flat</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Floor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tenant</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Flat Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Latest Reading</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Bill Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {flats.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No flats added yet. Click "Add Flat" to get started.
                    </td>
                  </tr>
                ) : (
                  flats.map((flat) => (
                    <tr key={flat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{flat.flatNumber}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{flat.floor}</td>
                      <td className="px-6 py-4">
                        {flat.tenant ? (
                          <div>
                            <p className="font-medium text-gray-900">{flat.tenant.name}</p>
                            <p className="text-sm text-gray-500">{flat.tenant.phone}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Vacant</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-mono text-sm">
                            {flat.flatCode}
                          </code>
                          <button
                            onClick={() => handleCopyFlatCode(flat.flatCode)}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <FaCopy />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {flat.latestReading ? (
                          <div>
                            <p className="font-medium text-gray-900">
                              {flat.latestReading.currentReading} units
                            </p>
                            <p className="text-sm text-gray-500">{flat.latestReading.billMonth}</p>
                            <p className="text-sm font-semibold text-blue-600">
                              ₹{flat.latestReading.billAmount?.toFixed(2)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">No readings</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {flat.latestReading ? (
                          flat.latestReading.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              <FaCheckCircle />
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                              Pending
                            </span>
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Add Reading Button */}
                          <button
                            onClick={() => {
                              setSelectedFlat(flat.id);
                              setShowAddReading(true);
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Add Reading
                          </button>

                          {/* Payment Request Button - Only for pending bills with tenants */}
                          {flat.latestReading?.status === 'pending' && flat.tenantId && (
                            <button
                              onClick={() => handleRequestPayment(flat)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Request Payment"
                            >
                              <FaPaperPlane />
                            </button>
                          )}

                          {/* Edit Bill Button */}
                          {flat.latestReading && (
                            <button
                              onClick={() => handleEditBill(flat.latestReading.id, flat)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Bill"
                            >
                              <FaEdit />
                            </button>
                          )}

                          {/* Delete Bill Button */}
                          {flat.latestReading && (
                            <button
                              onClick={() => handleDeleteBill(flat.latestReading.id)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Delete Bill"
                            >
                              <FaTrash />
                            </button>
                          )}

                          {/* Delete Flat Button - Only for vacant flats */}
                          {!flat.tenantId && (
                            <button
                              onClick={() => handleDeleteFlat(flat.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Flat"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Flat Modal */}
      {showAddFlat && (
        <AddFlatModal
          onClose={() => setShowAddFlat(false)}
          onSubmit={handleAddFlat}
        />
      )}

      {/* Add Reading Modal */}
      {showAddReading && (
        <AddReadingModal
          onClose={() => {
            setShowAddReading(false);
            setSelectedFlat(null);
          }}
          onSubmit={handleAddReading}
          flat={flats.find(f => f.id === selectedFlat)}
        />
      )}

      {/* Payment Request Modal */}
      {showPaymentRequest && selectedBill && selectedBillFlat && (
        <PaymentRequestModal
          bill={selectedBill}
          tenant={selectedBillFlat.tenant}
          property={property}
          flat={selectedBillFlat}
          onClose={() => {
            setShowPaymentRequest(false);
            setSelectedBill(null);
            setSelectedBillFlat(null);
          }}
        />
      )}
    </div>
  );
};

export default PropertyDetails;
