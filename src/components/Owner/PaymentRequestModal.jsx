// src/components/Owner/PaymentRequestModal.jsx
import React, { useState } from 'react';
import { FaTimes, FaEnvelope, FaSms, FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';

const PaymentRequestModal = ({ bill, tenant, property, flat, onClose }) => {
  const [method, setMethod] = useState('email');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);

  const defaultMessage = `Dear ${tenant?.name},

This is a reminder for your pending water bill payment.

Property: ${property?.name}
Flat: ${flat?.flatNumber}
Bill Month: ${bill?.billMonth}
Amount Due: ₹${bill?.billAmount?.toFixed(2)}
Due Date: ${new Date(bill?.dueDate).toLocaleDateString()}

Please make the payment at your earliest convenience.

Thank you,
${property?.name} Management`;

  const handleSend = async () => {
    setSending(true);

    try {
      const message = customMessage || defaultMessage;

      if (method === 'email') {
        // For email, we'll use mailto (or integrate with email service)
        const subject = `Water Bill Payment Reminder - ${bill.billMonth}`;
        const body = encodeURIComponent(message);
        window.open(`mailto:${tenant.email}?subject=${subject}&body=${body}`);
        
        toast.success('Email client opened! Please send the email.');
      } else if (method === 'sms') {
        // For SMS, use device's SMS app (mobile only)
        const smsBody = encodeURIComponent(message);
        window.open(`sms:${tenant.phone}?body=${smsBody}`);
        
        toast.success('SMS app opened! Please send the message.');
      } else if (method === 'whatsapp') {
        // For WhatsApp, use WhatsApp Web API
        const waMessage = encodeURIComponent(message);
        const phone = tenant.phone.replace(/[^0-9]/g, ''); // Remove non-numeric
        window.open(`https://wa.me/${phone}?text=${waMessage}`, '_blank');
        
        toast.success('WhatsApp opened! Please send the message.');
      }

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('Failed to send payment request');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <FaTimes className="text-xl" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Payment</h2>
        <p className="text-gray-600 mb-6">Send reminder to {tenant?.name}</p>

        {/* Bill Summary */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Bill Month</p>
              <p className="font-semibold text-gray-900">{bill.billMonth}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-semibold text-blue-600 text-lg">₹{bill.billAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(bill.dueDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-medium">
                Pending
              </span>
            </div>
          </div>
        </div>

        {/* Method Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Send via
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setMethod('email')}
              className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                method === 'email'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FaEnvelope className={`text-2xl ${method === 'email' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${method === 'email' ? 'text-blue-600' : 'text-gray-700'}`}>
                Email
              </span>
            </button>

            <button
              onClick={() => setMethod('sms')}
              className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                method === 'sms'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FaSms className={`text-2xl ${method === 'sms' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${method === 'sms' ? 'text-blue-600' : 'text-gray-700'}`}>
                SMS
              </span>
            </button>

            <button
              onClick={() => setMethod('whatsapp')}
              className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                method === 'whatsapp'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FaWhatsapp className={`text-2xl ${method === 'whatsapp' ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${method === 'whatsapp' ? 'text-green-600' : 'text-gray-700'}`}>
                WhatsApp
              </span>
            </button>
          </div>
        </div>

        {/* Message Preview/Edit */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={customMessage || defaultMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows="10"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            You can edit this message before sending
          </p>
        </div>

        {/* Tenant Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-6">
          <p className="text-sm text-gray-600">Sending to:</p>
          <p className="font-medium text-gray-900">{tenant?.name}</p>
          <p className="text-sm text-gray-600">
            {method === 'email' ? tenant?.email : tenant?.phone}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : `Send via ${method === 'email' ? 'Email' : method === 'sms' ? 'SMS' : 'WhatsApp'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentRequestModal;
