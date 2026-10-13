import { DeviceConnectionStatus, RawNotificationPayload } from '../../types/event';

export interface PairingHandshakeMessage {
  type: 'HANDSHAKE_INIT' | 'HANDSHAKE_ACK' | 'NOTIFICATION_EVENT' | 'HEARTBEAT_PING' | 'HEARTBEAT_PONG' | 'DEVICE_STATUS';
  authToken: string;
  payload?: unknown;
  timestamp: number;
}

export interface AndroidDeviceStatusPayload {
  notificationAccessEnabled: boolean;
  batteryOptimizationIgnored: boolean;
  ttsEngineReady: boolean;
  appVersion: string;
  androidVersion: string;
  deviceModel: string;
}

export type EventCallback = (notification: RawNotificationPayload) => void;
export type StatusCallback = (status: DeviceConnectionStatus, details?: string) => void;

export class DevicePairingService {
  private socket: WebSocket | null = null;
  private connectionStatus: DeviceConnectionStatus = DeviceConnectionStatus.STANDALONE_WEB;
  private pairingToken = 'snd_sec_key_7894';
  private companionPort = 8765;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeatTime: number | null = null;
  private deviceStatus: AndroidDeviceStatusPayload | null = null;

  private onEventCallbacks: Set<EventCallback> = new Set();
  private onStatusCallbacks: Set<StatusCallback> = new Set();

  public getStatus(): DeviceConnectionStatus {
    return this.connectionStatus;
  }

  public getDeviceStatus(): AndroidDeviceStatusPayload | null {
    return this.deviceStatus;
  }

  public getLastHeartbeat(): number | null {
    return this.lastHeartbeatTime;
  }

  public subscribeEvent(cb: EventCallback): () => void {
    this.onEventCallbacks.add(cb);
    return () => this.onEventCallbacks.delete(cb);
  }

  public subscribeStatus(cb: StatusCallback): () => void {
    this.onStatusCallbacks.add(cb);
    return () => this.onStatusCallbacks.delete(cb);
  }

  private setStatus(status: DeviceConnectionStatus, details?: string): void {
    this.connectionStatus = status;
    this.onStatusCallbacks.forEach(cb => cb(status, details));
  }

  /**
   * Connect to Android companion local WebSocket server (port 8765)
   */
  public connect(host = '127.0.0.1', token?: string): void {
    if (token) this.pairingToken = token;
    this.disconnect();

    const wsUrl = `ws://${host}:${this.companionPort}/soundless-bridge`;
    console.info(`Attempting local companion connection to ${wsUrl}...`);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.info('Connected to Android Companion bridge socket');
        // Send authenticated handshake
        const handshake: PairingHandshakeMessage = {
          type: 'HANDSHAKE_INIT',
          authToken: this.pairingToken,
          timestamp: Date.now()
        };
        this.socket?.send(JSON.stringify(handshake));
        this.setStatus(DeviceConnectionStatus.CONNECTED_LOCAL_BRIDGE, `Connected to Companion at ${host}`);
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as PairingHandshakeMessage;

          // Reject unauthenticated frames
          if (msg.authToken !== this.pairingToken) {
            console.warn('Rejected unauthenticated message from companion socket');
            return;
          }

          if (msg.type === 'HEARTBEAT_PONG') {
            this.lastHeartbeatTime = Date.now();
          } else if (msg.type === 'DEVICE_STATUS') {
            this.deviceStatus = msg.payload as AndroidDeviceStatusPayload;
            this.lastHeartbeatTime = Date.now();
          } else if (msg.type === 'NOTIFICATION_EVENT') {
            const raw = msg.payload as RawNotificationPayload;
            this.onEventCallbacks.forEach(cb => cb(raw));
          }
        } catch (err) {
          console.error('Error handling companion socket message:', err);
        }
      };

      this.socket.onerror = () => {
        // Expected when companion APK is not actively running local websocket
        this.setStatus(DeviceConnectionStatus.STANDALONE_WEB, 'Android companion not found on local port. Using standalone mode.');
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        if (this.connectionStatus !== DeviceConnectionStatus.SIMULATED_DEMO) {
          this.setStatus(DeviceConnectionStatus.STANDALONE_WEB, 'Companion bridge disconnected');
        }
      };
    } catch {
      this.setStatus(DeviceConnectionStatus.STANDALONE_WEB, 'Cannot create WebSocket');
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const ping: PairingHandshakeMessage = {
          type: 'HEARTBEAT_PING',
          authToken: this.pairingToken,
          timestamp: Date.now()
        };
        this.socket.send(JSON.stringify(ping));
      }
    }, 5000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // ignore
      }
      this.socket = null;
    }
    this.setStatus(DeviceConnectionStatus.STANDALONE_WEB);
  }

  public setSimulatedMode(): void {
    this.disconnect();
    this.setStatus(DeviceConnectionStatus.SIMULATED_DEMO, 'Running in Demo & Hackathon Simulation mode');
  }
}

export const devicePairingService = new DevicePairingService();
