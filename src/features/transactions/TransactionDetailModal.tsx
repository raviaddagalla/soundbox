import React from 'react';
import { X, Volume2, ShieldAlert, CheckCircle2, AlertTriangle, Copy, Check, Sparkles } from 'lucide-react';
import { SanitizedTransactionEvent, PaymentEventType, AnnouncementStatus } from '../../types/event';

interface TransactionDetailModalProps {
  transaction: SanitizedTransactionEvent | null;
  onClose: () => void;
  onRepeatVoice?: (tx: SanitizedTransactionEvent) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onRepeatVoice
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!transaction) return null;

  const handleCopyRef = () => {
    if (transaction.referenceId) {
      navigator.clipboard.writeText(transaction.referenceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isIncoming = transaction.eventType === PaymentEventType.INCOMING_PAYMENT;
  const isAnnounced = transaction.announcementStatus === AnnouncementStatus.ANNOUNCED;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className={`p-6 border-b text-white flex items-center justify-between ${
          isIncoming ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-slate-700 to-slate-900'
        }`}>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-bold bg-white/20 px-2 py-0.5 rounded">
                {transaction.sourceAppName}
              </span>
              {transaction.isSimulated && (
                <span className="text-xs uppercase tracking-wider font-bold bg-purple-400 text-purple-950 px-2 py-0.5 rounded flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Demo Event</span>
                </span>
              )}
            </div>
            <div className="text-3xl font-black mt-1">
              ₹{transaction.amount.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              {new Date(transaction.eventTimestamp).toLocaleString()}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Classification & Speech Result Box */}
          <div className={`p-4 rounded-2xl border ${
            isAnnounced
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : transaction.announcementStatus === AnnouncementStatus.SUPPRESSED_DUPLICATE
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-red-50 border-red-200 text-red-950'
          }`}>
            <div className="flex items-center justify-between font-bold text-sm">
              <span className="flex items-center space-x-1.5">
                {isAnnounced ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                <span>Status: {transaction.announcementStatus.replace('_', ' ')}</span>
              </span>
              <span className="text-xs uppercase px-2 py-0.5 rounded bg-white font-bold border border-current">
                {transaction.eventType.replace('_', ' ')}
              </span>
            </div>

            <p className="mt-2 text-xs leading-relaxed opacity-90">
              {transaction.rejectionReason || transaction.classificationReason}
            </p>

            {transaction.announcementText && (
              <div className="mt-3 pt-2.5 border-t border-current/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold opacity-75">Spoken Announcement:</span>
                  <div className="font-semibold italic text-xs mt-0.5">
                    "{transaction.announcementText}"
                  </div>
                </div>
                {onRepeatVoice && (
                  <button
                    onClick={() => onRepeatVoice(transaction)}
                    className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-indigo-700 shadow-sm"
                    title="Speak Again"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Details Table */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Customer / Payer:</span>
              <span className="font-bold text-slate-800">{transaction.payerName || 'Not specified in alert'}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Reference (UTR / Txn):</span>
              <div className="flex items-center space-x-1 font-mono font-bold text-slate-800">
                <span>{transaction.referenceId || 'N/A'}</span>
                {transaction.referenceId && (
                  <button
                    onClick={handleCopyRef}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600"
                    title="Copy Reference"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Deduplication Fingerprint:</span>
              <span className="font-mono text-[11px] text-slate-600 truncate max-w-[200px]" title={transaction.fingerprint}>
                {transaction.fingerprint}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Internal Event ID:</span>
              <span className="font-mono text-[11px] text-slate-500">{transaction.eventId}</span>
            </div>
          </div>

          {/* Sanitized Raw Summary */}
          <div className="space-y-1">
            <span className="font-semibold text-slate-700">Sanitized Notification Snippet:</span>
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700 font-mono text-[11px] leading-relaxed break-all">
              <div className="font-bold">{transaction.rawSummary.title}</div>
              <div>{transaction.rawSummary.textPreview}</div>
            </div>
            <p className="text-[10px] text-slate-400">
              *Full raw notification payloads are scrubbed from persistent storage to protect merchant privacy.
            </p>
          </div>

          {/* Legal Notice */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <span>
              This is a notification-derived record. For high-value audits, reconcile against your bank statement.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
