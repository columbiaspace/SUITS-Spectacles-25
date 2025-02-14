import { TSSData } from './TSS_Data';
let remoteServiceModule = require('LensStudio:RemoteServiceModule');

// Define WebSocket event types for Lens Studio
interface WebSocketEvent {}

interface WebSocketMessageEvent extends WebSocketEvent {
    data: any;  // Using any since we need to support both string and binary data
}

@component
export class TSSConnection extends BaseScriptComponent {
    @input statusText!: Text;
    @input tssData!: TSSData;
    
    private socket: WebSocket | null = null;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 5;
    private readonly RECONNECT_DELAY = 5000; // 5 seconds
    private reconnectEvent: SceneEvent | null = null;

    onAwake(): void {
        this.connectToTSS();
        // Set up periodic data requests
        this.createEvent('UpdateEvent').bind(() => {
            if (this.isConnected) {
                this.requestTSSData();
            }
        });
    }

    private connectToTSS(): void {
        try {
            const url = 'https://127.0.0.1:14141';
            print("Attempting to connect to TSS at: " + url);
            
            this.socket = remoteServiceModule.createWebSocket(url);
            if (!this.socket) {
                print("Failed to create WebSocket");
                return;
            }

            this.socket.binaryType = 'blob';
            this.setupSocketHandlers();
            this.updateStatus('Connecting to TSS...');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            print("Error connecting to TSS: " + errorMessage);
            this.updateStatus('Failed to create WebSocket connection');
        }
    }

    private setupSocketHandlers(): void {
        if (!this.socket) return;

        this.socket.onopen = () => {
            print("TSS WebSocket connected");
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.updateStatus('Connected to TSS');
            this.requestTSSData();
        };

        this.socket.onmessage = (event: any) => {
            try {
                if (event.data) {
                    // Since we can't use FileReader or Blob.arrayBuffer(), 
                    // we'll assume the data is already in the correct format
                    // The TSS server should send data as Uint8Array
                    if (event.data instanceof Uint8Array) {
                        this.handleBinaryData(new DataView(event.data.buffer));
                    } else {
                        print("Received unexpected non-binary data");
                    }
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                print("Error handling message: " + errorMessage);
            }
        };

        this.socket.onclose = () => {
            print("TSS WebSocket closed");
            this.isConnected = false;
            this.updateStatus('Disconnected from TSS');
            this.attemptReconnect();
        };

        this.socket.onerror = () => {
            print("TSS WebSocket error");
            this.updateStatus('Connection error');
        };
    }

    private handleBinaryData(dataView: DataView): void {
        try {
            // Parse binary data according to TSS protocol
            // | Timestamp (uint32) | Command number (uint32) | Input Data (float) |
            const timestamp = dataView.getUint32(0, false); // false = big endian
            const command = dataView.getUint32(4, false);
            const data = dataView.getFloat32(8, false);

            // Update appropriate data based on command number
            this.updateTSSData(command, data);
            this.updateDataDisplay();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            print("Error parsing binary data: " + errorMessage);
        }
    }

    private updateTSSData(command: number, value: number): void {
        // Update TSSData based on command number
        // Commands 2-7: EVA1 DCU states
        if (command >= 2 && command <= 7) {
            if (!this.tssData.dcu) {
                this.tssData.dcu = {
                    dcu: {
                        eva1: {
                            batt: false,
                            oxy: false,
                            comm: false,
                            fan: false,
                            pump: false,
                            co2: false
                        },
                        eva2: {
                            batt: false,
                            oxy: false,
                            comm: false,
                            fan: false,
                            pump: false,
                            co2: false
                        }
                    }
                };
            }
            const dcu = this.tssData.dcu.dcu.eva1;
            switch (command) {
                case 2: dcu.batt = value > 0;
                    break;
                case 3: dcu.oxy = value > 0;
                    break;
                case 4: dcu.comm = value > 0;
                    break;
                case 5: dcu.fan = value > 0;
                    break;
                case 6: dcu.pump = value > 0;
                    break;
                case 7: dcu.co2 = value > 0;
                    break;
            }
        }
        // Add more command handlers as needed
    }

    private requestTSSData(): void {
        if (!this.isConnected || !this.socket) return;

        try {
            // Create binary message according to TSS protocol
            const data = new Uint8Array(12); // 4 bytes timestamp + 4 bytes command + 4 bytes data
            const view = new DataView(data.buffer);
            
            // Set timestamp (current time in seconds since epoch)
            view.setUint32(0, Math.floor(Date.now() / 1000), false);
            
            // Set command number (e.g., 2 for first DCU state)
            view.setUint32(4, 2, false);
            
            // Set data (0.0 for request)
            view.setFloat32(8, 0.0, false);

            this.socket.send(data);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            print("Error sending data request: " + errorMessage);
        }
    }

    private updateStatus(status: string): void {
        if (this.statusText) {
            this.statusText.text = status;
        }
        print("TSS Status: " + status);
    }

    private updateDataDisplay(): void {
        let display = 'TSS Data Summary:\n';
        
        if (this.tssData.telemetry?.telemetry) {
            const t = this.tssData.telemetry.telemetry;
            display += `\nEVA Time: ${t.eva_time}s\n`;
            display += `\nEVA1:\n`;
            display += `Battery: ${t.eva1.batt_time_left}min\n`;
            display += `O2 Primary: ${t.eva1.oxy_pri_storage}psi\n`;
            display += `O2 Secondary: ${t.eva1.oxy_sec_storage}psi\n`;
            display += `Heart Rate: ${t.eva1.heart_rate}bpm\n`;
            display += `Suit Pressure: ${t.eva1.suit_pressure_total}psi\n`;
            display += `Temperature: ${t.eva1.temperature}°F\n`;
        }

        if (this.tssData.dcu?.dcu?.eva1) {
            const dcu = this.tssData.dcu.dcu.eva1;
            display += `\nDCU Status:\n`;
            display += `Battery: ${dcu.batt ? 'SUIT' : 'UMBILICAL'}\n`;
            display += `Oxygen: ${dcu.oxy ? 'PRI' : 'SEC'}\n`;
            display += `Comms: ${dcu.comm ? 'A' : 'B'}\n`;
            display += `Fan: ${dcu.fan ? 'PRI' : 'SEC'}\n`;
            display += `Pump: ${dcu.pump ? 'OPEN' : 'CLOSED'}\n`;
            display += `CO2: ${dcu.co2 ? 'A' : 'B'}\n`;
        }

        this.statusText.text = display;
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
            this.updateStatus('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        this.updateStatus(`Reconnecting (Attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`);
        
        // Schedule reconnect using UpdateEvent
        if (this.reconnectEvent) {
            this.removeEvent(this.reconnectEvent);
        }
        
        this.reconnectEvent = this.createEvent('UpdateEvent');
        this.reconnectEvent.bind(() => {
            if (!this.isConnected) {
                this.connectToTSS();
            }
            // Remove the event after it fires
            if (this.reconnectEvent) {
                this.removeEvent(this.reconnectEvent);
                this.reconnectEvent = null;
            }
        });
    }
} 