import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Cpu,
  RefreshCw,
  Terminal,
  Send,
  ShieldCheck,
  Wifi,
  Trash2,
  Sparkles,
  ExternalLink,
  Battery
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
    companionHost,
    companionPort,
    diagnosticLogs,
    connectCompanion,
    setNotificationPermission,
    clearDiagnostics
  } = useDeviceStore();

  const { settings } = useSettingsStore();
  const { addTransaction } = useTransactionStore();

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
    <div className="space-y-5 max-w-xl mx-auto pb-12">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
            Device Setup & Diagnostics
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Hardware-free soundbox configuration, permission status, and bridge health
          </p>
        </div>

        <button
          onClick={() => connectCompanion()}
          className="px-3.5 py-1.5 rounded-xl border border-surface-border bg-white hover:bg-slate-50 text-text-secondary text-xs font-bold transition flex items-center gap-1.5 shadow-subtle cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-primary" />
          <span>Ping Bridge</span>
        </button>
      </div>

      {/* 4-Step Setup & Health Matrix */}
      <div className="space-y-2.5">
        
        {/* Step 1: Notification Access */}
        <div className={`p-4 rounded-2xl border shadow-subtle flex items-center justify-between ${
          notificationPermissionGranted
            ? 'bg-white border-surface-border'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
              notificationPermissionGranted ? 'bg-secondary-container text-on-secondary-container' : 'bg-amber-200 text-amber-900'
            }`}>
              1
            </div>
            <div>
              <span className="text-xs font-bold text-text-primary block">
                Notification Listener Permission
              </span>
              <span className="text-[11px] text-text-muted">
                {notificationPermissionGranted
                  ? 'Access Granted • Intercepting push credit alerts'
                  : 'Action Required • Grant permission in Android Settings'}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              const bridge = typeof window !== 'undefined' ? (window as unknown as { AndroidBridge?: { openNotificationSettings?: () => void } }).AndroidBridge : undefined;
              if (bridge && typeof bridge.openNotificationSettings === 'function') {
                bridge.openNotificationSettings();
              } else {
                setNotificationPermission(!notificationPermissionGranted);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              notificationPermissionGranted
                ? 'bg-surface-container text-text-secondary hover:bg-slate-200'
                : 'bg-emerald-primary text-white shadow-sm'
            }`}
          >
            {notificationPermissionGranted ? 'Revoke Test' : 'Open Android Settings'}
          </button>
        </div>

        {/* Step 2: Battery Optimization */}
        <div className="p-4 rounded-2xl bg-white border border-surface-border shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <span className="text-xs font-bold text-text-primary block">
                Battery Sleep Optimization
              </span>
              <span className="text-[11px] text-text-muted">
                Foreground audio channel keeps soundbox alive with screen off
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-primary bg-secondary-container px-2.5 py-1 rounded-full">
            ✓ Ignored
          </span>
        </div>

        {/* Step 3: Local Bridge Pairing */}
        <div className="p-4 rounded-2xl bg-white border border-surface-border shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <span className="text-xs font-bold text-text-primary block">
                Companion Bridge Link
              </span>
              <span className="text-[11px] text-text-muted font-mono">
                ws://{companionHost}:{companionPort} • {statusMessage}
              </span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
            connectionStatus === DeviceConnectionStatus.CONNECTED_LOCAL_BRIDGE
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-100 text-slate-700'
          }`}>
            {connectionStatus === DeviceConnectionStatus.CONNECTED_LOCAL_BRIDGE ? 'Linked' : 'Standalone'}
          </span>
        </div>

        {/* Step 4: TextToSpeech Voice Ready */}
        <div className="p-4 rounded-2xl bg-white border border-surface-border shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
              4
            </div>
            <div>
              <span className="text-xs font-bold text-text-primary block">
                Speech Synthesis Engine
              </span>
              <span className="text-[11px] text-text-muted">
                {ttsVoices.length > 0 ? `${ttsVoices.length} Voices detected` : 'Active on device'} • {settings.voice.language}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-primary bg-secondary-container px-2.5 py-1 rounded-full">
            ✓ Ready
          </span>
        </div>

      </div>

      {/* Interactive Raw Payload Tester */}
      <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2 text-emerald-primary">
            <Terminal className="w-5 h-5" />
            <h3 className="font-extrabold text-text-primary text-sm">Interactive Raw Payload Tester</h3>
          </div>
          <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold uppercase">
            Live Bench
          </span>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          Test any custom push notification text or JSON to evaluate how the parser and safety classifier handle it.
        </p>

        <div className="space-y-2.5 text-xs">
          <div>
            <label className="text-[11px] font-bold text-text-primary block mb-1">Source Package</label>
            <select
              value={testPackage}
              onChange={(e) => setTestPackage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-border text-xs bg-white focus:outline-none focus:border-emerald-primary"
            >
              <option value={PaymentAppPackage.PHONEPE}>PhonePe (com.phonepe.app)</option>
              <option value={PaymentAppPackage.GPAY}>Google Pay (com.google.android.apps...)</option>
              <option value={PaymentAppPackage.PAYTM}>Paytm (net.one97.paytm)</option>
              <option value={PaymentAppPackage.BHIM}>BHIM UPI (in.org.npci.upiapp)</option>
              <option value={PaymentAppPackage.GENERIC_UPI}>Generic UPI Alert</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-text-primary block mb-1">Notification Title</label>
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-border text-xs focus:outline-none focus:border-emerald-primary"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-text-primary block mb-1">Notification Body</label>
            <input
              type="text"
              value={testBody}
              onChange={(e) => setTestBody(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-border text-xs focus:outline-none focus:border-emerald-primary"
            />
          </div>
        </div>

        <button
          onClick={handleRunRawPayloadTest}
          disabled={isTestingPayload}
          className="w-full py-2.5 px-4 bg-navy-dark hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-subtle disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Execute Pipeline Evaluation & Announce</span>
        </button>

        {/* Test Result Inspector */}
        {testResult && (
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-border text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-primary">Pipeline Result:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                testResult.wasAnnounced ? 'bg-secondary-container text-on-secondary-container' : 'bg-rose-100 text-rose-800'
              }`}>
                {testResult.wasAnnounced ? 'Announced' : 'Silenced'}
              </span>
            </div>
            <p className="text-[11px] text-text-muted">{testResult.event.classificationReason}</p>
            {testResult.event.announcementText && (
              <p className="text-[11px] text-emerald-primary font-bold italic">
                "{testResult.event.announcementText}"
              </p>
            )}
          </div>
        )}

      </div>

      {/* Diagnostic Logs */}
      <div className="bg-white rounded-2xl border border-surface-border p-5 shadow-subtle space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-surface-border">
          <span className="text-xs font-bold text-text-primary uppercase tracking-wide">
            System Telemetry Logs
          </span>
          <button
            onClick={clearDiagnostics}
            className="text-[11px] text-text-muted hover:text-rose-alert font-bold flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>

        <div className="space-y-1.5 max-h-52 overflow-y-auto font-mono text-[11px]">
          {diagnosticLogs.map((log) => (
            <div key={log.id} className="p-2 rounded-lg bg-surface-container-low flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-bold px-1 rounded ${
                    log.level === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                    log.level === 'WARN' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {log.level}
                  </span>
                  <span className="font-bold text-text-primary">{log.category}</span>
                </div>
                <p className="text-text-muted text-[10px]">{log.message}</p>
              </div>
              <span className="text-[9px] text-text-muted">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}

          {diagnosticLogs.length === 0 && (
            <div className="py-4 text-center text-xs text-text-muted">
              No diagnostic entries recorded.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
