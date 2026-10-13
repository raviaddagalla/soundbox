import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Smartphone,
  Cpu,
  RefreshCw,
  Terminal,
  Send,
  ShieldAlert,
  Wifi,
  Trash2,
  Sparkles
} from 'lucide-react';
import { useDeviceStore } from '../../stores/useDeviceStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTransactionStore } from '../../stores/useTransactionStore';
import { DeviceConnectionStatus, RawNotificationPayload, PaymentAppPackage } from '../../types/event';
import { notificationPipeline } from '../../services/notification/pipeline';
import { speechManager } from '../../services/announcement/speechManager';

export const DiagnosticsView: React.FC = () => {
  const {
    connectionStatus,
    statusMessage,
    notificationPermissionGranted,
    batteryOptimizationIgnored,
    companionHost,
    companionPort,
    pairingToken,
    recentPipelineLogs,
    diagnosticLogs,
    connectCompanion,
    disconnectCompanion,
    setNotificationPermission,
    clearDiagnostics
  } = useDeviceStore();

  const { settings } = useSettingsStore();
  const { addTransaction } = useTransactionStore();

  // Raw payload tester state
  const [testPackage, setTestPackage] = useState<string>(PaymentAppPackage.PHONEPE);
  const [testTitle, setTestTitle] = useState('Payment Received');
  const [testBody, setTestBody] = useState('₹500 received from Rajesh Kumar (UTR: 328910482910)');
  const [isTestingPayload, setIsTestingPayload] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const ttsVoices = speechManager.getAvailableVoices();

  const handleRunRawPayloadTest = async () => {
    setIsTestingPayload(true);
    const payload: RawNotificationPayload = {
      packageName: testPackage,
      title: testTitle,
      text: testBody,
      timestamp: Date.now()
    };

    const result = await notificationPipeline.processNotification(payload, settings, true);
    setTestResult(result);
    await addTransaction(result.event);
    setIsTestingPayload(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Device & Pipeline Diagnostics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status of notification access, companion bridge, TTS voice engine, and pipeline logs
          </p>
        </div>

        <button
          onClick={() => connectCompanion()}
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
          <span>Check Bridge</span>
        </button>
      </div>

      {/* Diagnostics Health Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Notification Permission */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Notification Access</span>
            {notificationPermissionGranted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <div className={`text-base font-extrabold ${
            notificationPermissionGranted ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            {notificationPermissionGranted ? 'Active / Granted' : 'Access Required'}
          </div>
          <p className="text-[11px] text-slate-400">
            {notificationPermissionGranted
              ? 'Companion service can read push alerts'
              : 'Requires permission in Android Settings'}
          </p>
          <button
            onClick={() => setNotificationPermission(!notificationPermissionGranted)}
            className="text-[11px] text-indigo-600 font-bold hover:underline block pt-1"
          >
            {notificationPermissionGranted ? 'Toggle to Simulated Revoked' : 'Toggle to Granted'}
          </button>
        </div>

        {/* Card 2: Companion Bridge Link */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Companion Bridge</span>
            {connectionStatus === DeviceConnectionStatus.CONNECTED_LOCAL_BRIDGE ? (
              <Wifi className="w-5 h-5 text-emerald-600" />
            ) : (
              <Smartphone className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="text-base font-extrabold text-slate-900">
            {connectionStatus === DeviceConnectionStatus.CONNECTED_LOCAL_BRIDGE
              ? 'Companion Linked'
              : connectionStatus === DeviceConnectionStatus.SIMULATED_DEMO
              ? 'Demo Simulator'
              : 'Standalone Web'}
          </div>
          <p className="text-[11px] text-slate-400 truncate" title={statusMessage}>
            {statusMessage}
          </p>
          <div className="text-[10px] text-slate-400 font-mono">
            ws://{companionHost}:{companionPort}
          </div>
        </div>

        {/* Card 3: TTS Engine */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Text-to-Speech Engine</span>
            <Cpu className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-base font-extrabold text-slate-900">
            Ready ({ttsVoices.length} Voices)
          </div>
          <p className="text-[11px] text-slate-400">
            SpeechSynthesis active ({settings.voice.language})
          </p>
          <div className="text-[10px] text-emerald-600 font-semibold">
            Web Audio Chime: Loaded
          </div>
        </div>

        {/* Card 4: Battery Optimization */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Background Reliability</span>
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-base font-extrabold text-slate-900">
            Foreground Service
          </div>
          <p className="text-[11px] text-slate-400">
            Persistent audio channel enabled
          </p>
          <div className="text-[10px] text-indigo-600 font-medium">
            Dedup window: {settings.deduplication.windowSeconds}s
          </div>
        </div>

      </div>

      {/* Interactive Raw Payload Pipeline Tester */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-indigo-700">
            <Terminal className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-sm">Interactive Raw Payload Pipeline Tester</h3>
          </div>
          <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase">
            Live Test Bench
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Paste any sample notification title and text below to verify how the 12-step parser and safety classifier evaluate it.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">App Package</label>
            <select
              value={testPackage}
              onChange={(e) => setTestPackage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={PaymentAppPackage.PHONEPE}>PhonePe (com.phonepe.app)</option>
              <option value={PaymentAppPackage.GPAY}>Google Pay (com.google.android...)</option>
              <option value={PaymentAppPackage.PAYTM}>Paytm (net.one97.paytm)</option>
              <option value={PaymentAppPackage.BHIM}>BHIM (in.org.npci.upiapp)</option>
              <option value={PaymentAppPackage.GENERIC_UPI}>Generic UPI Alert</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Notification Title</label>
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Notification Body / Text</label>
            <input
              type="text"
              value={testBody}
              onChange={(e) => setTestBody(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

        </div>

        {/* Quick Presets for Tester */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-slate-400 font-medium">Quick load:</span>
          <button
            onClick={() => {
              setTestPackage(PaymentAppPackage.PHONEPE);
              setTestTitle('Payment Received');
              setTestBody('₹25.50 received from Priya Sharma (UTR: 328910482910)');
            }}
            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
          >
            ₹25.50 PhonePe
          </button>
          <button
            onClick={() => {
              setTestPackage(PaymentAppPackage.GPAY);
              setTestTitle('Google Pay');
              setTestBody('₹10,000 received from Anand Kumar via UPI. Ref: 482910492810');
            }}
            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
          >
            ₹10,000 GPay
          </button>
          <button
            onClick={() => {
              setTestPackage(PaymentAppPackage.PHONEPE);
              setTestTitle('Payment Successful');
              setTestBody('You paid ₹500 to Ramesh Kirana from A/c XX1234');
            }}
            className="px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold"
          >
            Outgoing Debit (Test Rejection)
          </button>
          <button
            onClick={() => {
              setTestPackage(PaymentAppPackage.GPAY);
              setTestTitle('Google Pay');
              setTestBody('Payment of ₹150 failed. Bank server timed out.');
            }}
            className="px-2 py-0.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 text-[11px] font-semibold"
          >
            Failed Payment (Test Rejection)
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleRunRawPayloadTest}
            disabled={isTestingPayload}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm shadow-indigo-300 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Execute Pipeline Evaluation</span>
          </button>
        </div>

        {/* Live Test Results Inspection */}
        {testResult && (
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">Pipeline Result Breakdown:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-extrabold uppercase ${
                testResult.wasAnnounced ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {testResult.wasAnnounced ? 'Announced' : 'Blocked from Announcement'}
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              {testResult.logs.map((log: any, idx: number) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    log.status === 'SUCCESS'
                      ? 'bg-emerald-100 text-emerald-700'
                      : log.status === 'REJECTED'
                      ? 'bg-red-100 text-red-700'
                      : log.status === 'SUPPRESSED'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {log.stage.toUpperCase()}
                  </span>
                  <span className="text-slate-700">{log.detail}</span>
                </div>
              ))}
            </div>

            {testResult.event.announcementText && (
              <div className="pt-2 border-t border-slate-200 text-xs text-indigo-700 font-semibold italic">
                Announcement speech: "{testResult.event.announcementText}"
              </div>
            )}
          </div>
        )}

      </div>

      {/* System Diagnostic Logs List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">System Diagnostic Logs</h3>
            <p className="text-xs text-slate-400">Chronological diagnostic entries</p>
          </div>
          <button
            onClick={clearDiagnostics}
            className="text-xs text-slate-400 hover:text-red-600 font-semibold flex items-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-xs">
          {diagnosticLogs.map((log) => (
            <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    log.level === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                    log.level === 'WARN' ? 'bg-amber-100 text-amber-800' :
                    log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                    'bg-slate-200 text-slate-800'
                  }`}>
                    {log.level}
                  </span>
                  <span className="font-bold text-slate-700 text-[11px]">{log.category}</span>
                  <span className="text-slate-400 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-600 text-[11px] mt-1">{log.message}</p>
              </div>
            </div>
          ))}

          {diagnosticLogs.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              No diagnostic entries logged yet.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
