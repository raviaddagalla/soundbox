import React, { useState } from 'react';
import { ShieldAlert, Info, ChevronRight, X } from 'lucide-react';

export const TrustBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <>
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong className="font-semibold">Trust & Safety Notice:</strong> Announcements are derived from Android push notifications, not direct bank settlement confirmation.
          </span>
        </div>
        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            onClick={() => setIsOpen(true)}
            className="text-amber-700 hover:text-amber-900 font-medium underline flex items-center space-x-0.5"
          >
            <span>Learn More</span>
            <ChevronRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-amber-500 hover:text-amber-700 p-0.5 rounded"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5 text-amber-600">
                <ShieldAlert className="w-6 h-6" />
                <h3 className="font-bold text-slate-900 text-lg">Payment Trust & Safety Policy</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-sm text-slate-600 leading-relaxed">
              <p>
                <strong>Soundless UPI</strong> listens to system notifications sent by your payment apps (PhonePe, GPay, Paytm, BHIM) and reads out eligible incoming amounts aloud.
              </p>
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 space-y-1.5 text-xs">
                <div className="font-semibold flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-amber-700" />
                  <span>Important Merchant Safeguards:</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  <li>A notification indicates that your payment app posted a credit alert.</li>
                  <li>It is not a direct cryptographic guarantee from RBI, NPCI, or your bank.</li>
                  <li>Soundless UPI strictly rejects outgoing debits, failed payments, and pending requests.</li>
                  <li>For exceptionally large payments, always double-check your bank passbook or payment app directly.</li>
                </ul>
              </div>
              <p className="text-xs text-slate-500">
                This software will never ask for your UPI PIN, ATM PIN, bank password, or OTP. Keep your phone secure.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
