// src/components/Tenant/PaymentModal.jsx
import React, { useState } from 'react';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { FaTimes, FaMoneyBillWave, FaUpload, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const PaymentModal = ({ bill, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);

  // RAZORPAY CONFIGURATION
  const RAZORPAY_KEY_ID = 'rzp_test_SGuxFOKW8KMeBb'; // Replace with your Razorpay Key ID

  const handleRazorpayPayment = () => {
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: bill.billAmount * 100, // Amount in paise
      currency: 'INR',
      name: 'AquaBill Manager',
      description: `Water Bill - ${bill.billMonth}`,
      handler: async function (response) {
        try {
          // Payment successful
          console.log('Payment successful:', response);

          // Update bill status in Firestore
          await updateDoc(doc(db, 'waterReadings', bill.id), {
            status: 'paid',
            paidAt: new Date().toISOString()
          });

          // Create payment record
          await addDoc(collection(db, 'payments'), {
            billId: bill.id,
            tenantId: currentUser.uid,
            amount: bill.billAmount,
            paymentMethod: 'razorpay',
            razorpayPaymentId: response.razorpay_payment_id,
            status: 'completed',
            paidAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          });

          toast.success('Payment successful!');
          onSuccess();
        } catch (error) {
          console.error('Error updating payment:', error);
          toast.error('Payment recorded but failed to update status');
        }
      },
      prefill: {
        email: currentUser.email,
        contact: ''
      },
      theme: {
        color: '#2563eb'
      },
      modal: {
        ondismiss: function() {
          console.log('Payment cancelled by user');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleScreenshotUpload = async (e) => {
    e.preventDefault();
    
    if (!screenshot) {
      toast.error('Please select a screenshot');
      return;
    }

    setUploading(true);

    try {
      // Upload screenshot to Firebase Storage
      const storageRef = ref(storage, `payment-screenshots/${currentUser.uid}/${Date.now()}-${screenshot.name}`);
      await uploadBytes(storageRef, screenshot);
      const downloadURL = await getDownloadURL(storageRef);

      // Create payment record
      await addDoc(collection(db, 'payments'), {
        billId: bill.id,
        tenantId: currentUser.uid,
        amount: bill.billAmount,
        paymentMethod: 'screenshot',
        screenshotUrl: downloadURL,
        status: 'pending_verification',
        createdAt: new Date().toISOString()
      });

      // Update bill status to pending verification
      await updateDoc(doc(db, 'waterReadings', bill.id), {
        status: 'pending_verification',
        screenshotSubmittedAt: new Date().toISOString()
      });

      toast.success('Screenshot uploaded! Awaiting owner verification');
      onSuccess();
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      toast.error('Failed to upload screenshot');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setScreenshot(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <FaTimes className="text-xl" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pay Water Bill</h2>
        <p className="text-gray-600 mb-6">{bill.billMonth}</p>

        {/* Bill Details */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700">Units Consumed</span>
            <span className="font-semibold text-gray-900">{bill.unitsConsumed} units</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700">Water Charges</span>
            <span className="font-semibold text-gray-900">₹{(bill.billAmount - 50).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700">Fixed Charges</span>
            <span className="font-semibold text-gray-900">₹50.00</span>
          </div>
          <div className="h-px bg-blue-200 my-3"></div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">Total Amount</span>
            <span className="text-2xl font-bold text-blue-600">₹{bill.billAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setPaymentMethod('razorpay')}
            className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
              paymentMethod === 'razorpay'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FaMoneyBillWave className={`text-2xl ${paymentMethod === 'razorpay' ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`font-medium ${paymentMethod === 'razorpay' ? 'text-blue-600' : 'text-gray-700'}`}>
              Razorpay
            </span>
          </button>

          <button
            onClick={() => setPaymentMethod('screenshot')}
            className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
              paymentMethod === 'screenshot'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <FaUpload className={`text-2xl ${paymentMethod === 'screenshot' ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`font-medium ${paymentMethod === 'screenshot' ? 'text-blue-600' : 'text-gray-700'}`}>
              Screenshot
            </span>
          </button>
        </div>

        {/* Payment Actions */}
        {paymentMethod === 'razorpay' ? (
          <div>
            <p className="text-sm text-gray-600 mb-4 text-center">
              You will be redirected to Razorpay secure payment gateway
            </p>
            <button
              onClick={handleRazorpayPayment}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold text-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <FaMoneyBillWave />
              Pay ₹{bill.billAmount.toFixed(2)} with Razorpay
            </button>
          </div>
        ) : (
          <form onSubmit={handleScreenshotUpload}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Payment Screenshot
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="screenshot-upload"
                  required
                />
                <label
                  htmlFor="screenshot-upload"
                  className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 cursor-pointer transition-colors"
                >
                  <FaUpload className="text-gray-400" />
                  <span className="text-gray-600">
                    {screenshot ? screenshot.name : 'Click to select screenshot'}
                  </span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Upload a screenshot of your payment confirmation (Max 5MB)
              </p>
            </div>

            {screenshot && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100 flex items-center gap-2">
                <FaCheckCircle className="text-green-600" />
                <span className="text-sm text-green-700">Screenshot selected: {screenshot.name}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !screenshot}
              className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <FaUpload />
                  Submit Screenshot
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-500 mt-3">
              Your payment will be verified by the owner within 24 hours
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
