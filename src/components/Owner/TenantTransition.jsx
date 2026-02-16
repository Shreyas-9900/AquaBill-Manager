// src/components/Owner/TenantTransition.jsx
import React, { useState } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaTimes, FaUserMinus, FaUserPlus, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const TenantTransitionModal = ({ flat, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Confirm, 2: Processing, 3: Success
  const [finalReading, setFinalReading] = useState('');

  const handleRemoveTenant = async () => {
    try {
      setStep(2);

      // Get tenant user document
      const tenantDoc = await getDoc(doc(db, 'users', flat.tenantId));
      if (tenantDoc.exists()) {
        // Remove flatId from tenant's user profile
        await updateDoc(doc(db, 'users', flat.tenantId), {
          flatId: null
        });
      }

      // Update flat to mark as vacant
      await updateDoc(doc(db, 'flats', flat.id), {
        tenantId: null,
        previousTenantId: flat.tenantId, // Keep for records
        vacatedAt: new Date().toISOString(),
        finalReading: finalReading ? parseFloat(finalReading) : null
      });

      // Regenerate invite code for new tenant
      const newInviteCode = generateInviteCode();
      await updateDoc(doc(db, 'flats', flat.id), {
        flatCode: newInviteCode
      });

      setStep(3);
      toast.success('Tenant removed successfully! New invite code generated.');
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Error removing tenant:', error);
      toast.error('Failed to remove tenant');
      setStep(1);
    }
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        {step !== 3 && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="text-xl" />
          </button>
        )}

        {step === 1 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <FaExclamationTriangle className="text-orange-600 text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Remove Tenant</h2>
                <p className="text-sm text-gray-600">Flat {flat.flatNumber}</p>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-orange-900 mb-2">This will:</h3>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Remove current tenant's access to this flat</li>
                <li>• Mark the flat as vacant</li>
                <li>• Generate a new invite code for the next tenant</li>
                <li>• Keep all previous bill records</li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Final Water Meter Reading <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={finalReading}
                onChange={(e) => setFinalReading(e.target.value)}
                placeholder="Enter final reading for records"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be saved as the final reading for the outgoing tenant
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveTenant}
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <FaUserMinus />
                Remove Tenant
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Processing...</h3>
            <p className="text-gray-600">Removing tenant and updating records</p>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Tenant Removed!</h3>
            <p className="text-gray-600 mb-4">Flat is now vacant and ready for new tenant</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-1">New invite code generated:</p>
              <p className="text-2xl font-mono font-bold text-blue-900">Loading...</p>
            </div>
            <p className="text-sm text-gray-500">
              Share this code with your new tenant for signup
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantTransitionModal;
