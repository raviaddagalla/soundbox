import { create } from 'zustand';
import { DEMO_SCENARIOS, DemoScenario } from '../features/demo/demoPresets';
import { notificationPipeline, PipelineResult } from '../services/notification/pipeline';
import { useSettingsStore } from './useSettingsStore';
import { useTransactionStore } from './useTransactionStore';
import { useDeviceStore } from './useDeviceStore';
import { PaymentAppPackage } from '../types/event';

interface DemoStoreState {
  isSimulating: boolean;
  activeScenarioId: string | null;
  pipelineStageIndex: number; // 0=None, 1=Ingest, 2=Normalize/Parse, 3=Classify, 4=Dedup, 5=Queue/Announce
  lastResult: PipelineResult | null;
  isTourRunning: boolean;

  runScenario: (scenario: DemoScenario) => Promise<PipelineResult>;
  runDuplicateTest: () => Promise<void>;
  runLegitimateIdenticalAmountsTest: () => Promise<void>;
  runFullDemoTour: () => Promise<void>;
  stopTour: () => void;
}

export const useDemoStore = create<DemoStoreState>((set, get) => ({
  isSimulating: false,
  activeScenarioId: null,
  pipelineStageIndex: 0,
  lastResult: null,
  isTourRunning: false,

  runScenario: async (scenario: DemoScenario) => {
    set({
      isSimulating: true,
      activeScenarioId: scenario.id,
      pipelineStageIndex: 1
    });

    const settings = useSettingsStore.getState().settings;

    // Simulate animated pipeline progression
    await new Promise(r => setTimeout(r, 200));
    set({ pipelineStageIndex: 2 });
    await new Promise(r => setTimeout(r, 200));
    set({ pipelineStageIndex: 3 });
    await new Promise(r => setTimeout(r, 200));
    set({ pipelineStageIndex: 4 });

    const result = await notificationPipeline.processNotification(
      { ...scenario.payload, timestamp: Date.now() },
      settings,
      true
    );

    set({ pipelineStageIndex: 5 });

    // Store in transaction history & logs
    await useTransactionStore.getState().addTransaction(result.event);
    useDeviceStore.getState().addPipelineLogs(result.logs);

    set({
      isSimulating: false,
      lastResult: result
    });

    return result;
  },

  runDuplicateTest: async () => {
    const baseScenario = DEMO_SCENARIOS[0]; // PhonePe ₹50
    // Event 1: Normal payment
    await get().runScenario(baseScenario);

    // Wait 1.2 seconds, then re-deliver identical notification with same UTR
    await new Promise(r => setTimeout(r, 1200));

    const duplicatePayload = {
      ...baseScenario,
      id: 'phonepe_duplicate_test',
      name: 'PhonePe: Duplicate Notification Re-Delivery',
      description: 'Identical notification with same UTR within dedup window. Should be suppressed.'
    };

    await get().runScenario(duplicatePayload);
  },

  runLegitimateIdenticalAmountsTest: async () => {
    // Customer 1 buys ₹20 Chai
    const customer1: DemoScenario = {
      id: 'chai_cust_1',
      name: 'Customer 1: ₹20.00 (Chai)',
      badge: 'Incoming',
      description: 'First customer buys tea via UPI.',
      expectedOutcome: 'ANNOUNCED',
      payload: {
        packageName: PaymentAppPackage.PHONEPE,
        title: 'Payment Received',
        text: '₹20 received from Rahul Verma (UTR: 329104819201)',
        timestamp: Date.now()
      }
    };
    await get().runScenario(customer1);

    await new Promise(r => setTimeout(r, 1500));

    // Customer 2 ALSO buys ₹20 Chai (same amount, distinct UTR & customer!)
    const customer2: DemoScenario = {
      id: 'chai_cust_2',
      name: 'Customer 2: ₹20.00 (Chai - Same Amount)',
      badge: 'Incoming',
      description: 'Second customer buys same ₹20 tea. Must NOT be wrongly discarded!',
      expectedOutcome: 'ANNOUNCED',
      payload: {
        packageName: PaymentAppPackage.GPAY,
        title: 'Google Pay',
        text: '₹20.00 received from Sneha Roy (Ref: 481920481920)',
        timestamp: Date.now()
      }
    };
    await get().runScenario(customer2);
  },

  runFullDemoTour: async () => {
    set({ isTourRunning: true });
    const scenarios = [
      DEMO_SCENARIOS[0], // ₹50 incoming
      DEMO_SCENARIOS[5], // Outgoing ₹500 (Rejected)
      DEMO_SCENARIOS[6], // Failed ₹250 (Rejected)
      DEMO_SCENARIOS[7], // Pending ₹1000 (Rejected)
      DEMO_SCENARIOS[8], // Refund ₹150 (Refund Announced)
    ];

    for (const s of scenarios) {
      if (!get().isTourRunning) break;
      await get().runScenario(s);
      await new Promise(r => setTimeout(r, 2200));
    }

    set({ isTourRunning: false });
  },

  stopTour: () => {
    set({ isTourRunning: false, isSimulating: false });
  }
}));
