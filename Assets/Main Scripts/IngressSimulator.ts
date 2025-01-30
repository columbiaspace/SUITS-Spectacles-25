import { Interactable } from "SpectaclesInteractionKit/Components/Interaction/Interactable/Interactable";
import { validate } from "../SpectaclesInteractionKit/Utils/validate";
import { UIAData, TelemetryData, SpecData, RoverData, IMUData, DCUData, COMMData } from './TSS_Data';

@component
export class IngressSimulator extends BaseScriptComponent {
    @input nextButton!: Interactable;
    @input prevButton!: Interactable;
    @input statusText!: Text;

    // Internal TSS data state
    public uiaData: UIAData = {
        uia: {
            eva1_power: false,
            eva1_oxy: false,
            eva1_water_supply: false,
            eva1_water_waste: false,
            eva2_power: false,
            eva2_oxy: false,
            eva2_water_supply: false,
            eva2_water_waste: false,
            oxy_vent: false,
            depress: false
        }
    };

    public dcuData: DCUData = {
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

    public telemetryData: TelemetryData = {
        telemetry: {
            eva_time: 0,
            eva1: {
                batt_time_left: 100,
                oxy_pri_storage: 100,
                oxy_sec_storage: 100,
                oxy_pri_pressure: 100,
                oxy_sec_pressure: 100,
                oxy_time_left: 100,
                heart_rate: 80,
                oxy_consumption: 1,
                co2_production: 1,
                suit_pressure_oxy: 100,
                suit_pressure_co2: 0,
                suit_pressure_other: 0,
                suit_pressure_total: 100,
                fan_pri_rpm: 1000,
                fan_sec_rpm: 0,
                helmet_pressure_co2: 0,
                scrubber_a_co2_storage: 0,
                scrubber_b_co2_storage: 0,
                temperature: 70,
                coolant_ml: 100,
                coolant_gas_pressure: 100,
                coolant_liquid_pressure: 100
            },
            eva2: {
                batt_time_left: 100,
                oxy_pri_storage: 100,
                oxy_sec_storage: 100,
                oxy_pri_pressure: 100,
                oxy_sec_pressure: 100,
                oxy_time_left: 100,
                heart_rate: 80,
                oxy_consumption: 1,
                co2_production: 1,
                suit_pressure_oxy: 100,
                suit_pressure_co2: 0,
                suit_pressure_other: 0,
                suit_pressure_total: 100,
                fan_pri_rpm: 1000,
                fan_sec_rpm: 0,
                helmet_pressure_co2: 0,
                scrubber_a_co2_storage: 0,
                scrubber_b_co2_storage: 0,
                temperature: 70,
                coolant_ml: 100,
                coolant_gas_pressure: 100,
                coolant_liquid_pressure: 100
            }
        }
    };

    public duringEVA: boolean = false;

    public currentStep: number = 1;
    public currentSubStep: number = 1;
    private readonly steps: { [key: number]: { [key: number]: string } } = {
        1: {
            1: "Step 1.1: Connect EV-1 UIA and DCU umbilical",
            2: "Step 1.2: EV-1 EMU Power ON",
            3: "Step 1.3: Set BATT to UMB"
        },
        2: {
            1: "Step 2.1: Open O2 vent",
            2: "Step 2.2: Waiting for O2 tanks to drop below 10psi...",
            3: "Step 2.3: Close O2 vent"
        },
        3: {
            1: "Step 3.1: Open DCU pump",
            2: "Step 3.2: Open EV-1 waste water",
            3: "Step 3.3: Waiting for coolant to drop below 5%...",
            4: "Step 3.4: Close EV-1 waste water"
        },
        4: {
            1: "Step 4.1: Toggle EV-1 EMU Power OFF",
            2: "Step 4.2: Disconnect UIA umbilical"
        }
    };

    onAwake(): void {
        validate(this.nextButton);
        validate(this.prevButton);
        validate(this.statusText);

        print("[IngressSimulator] Starting initialization");
        // Initialize the simulated TSS data
        this.initializeTSSData();

        // Bind button events
        this.nextButton.onTriggerEnd.add(() => this.nextStep());
        this.prevButton.onTriggerEnd.add(() => this.previousStep());

        // Initialize display
        this.updateDisplay();
        //this.createEvent('UpdateEvent').bind(this.updateDisplay.bind(this))
        print("[IngressSimulator] Initialization complete");
    }

    private initializeTSSData(): void {
        // Initialize the TSS data that will be shared with Ingress.ts
        print("[IngressSimulator] Initializing all TSS data");
        
        // No need to create temporary objects - directly set the properly structured data
        this.uiaData = {
            uia: {
                eva1_power: false,
                eva1_oxy: false,
                eva1_water_supply: false,
                eva1_water_waste: false,
                eva2_power: false,
                eva2_oxy: false,
                eva2_water_supply: false,
                eva2_water_waste: false,
                oxy_vent: false,
                depress: false
            }
        };

        this.dcuData = {
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

        this.telemetryData = {
            telemetry: {
                eva_time: 0,
                eva1: {
                    batt_time_left: 100,
                    oxy_pri_storage: 100,
                    oxy_sec_storage: 100,
                    oxy_pri_pressure: 100,
                    oxy_sec_pressure: 100,
                    oxy_time_left: 100,
                    heart_rate: 80,
                    oxy_consumption: 1,
                    co2_production: 1,
                    suit_pressure_oxy: 100,
                    suit_pressure_co2: 0,
                    suit_pressure_other: 0,
                    suit_pressure_total: 100,
                    fan_pri_rpm: 1000,
                    fan_sec_rpm: 0,
                    helmet_pressure_co2: 0,
                    scrubber_a_co2_storage: 0,
                    scrubber_b_co2_storage: 0,
                    temperature: 70,
                    coolant_ml: 100,
                    coolant_gas_pressure: 100,
                    coolant_liquid_pressure: 100
                },
                eva2: {
                    batt_time_left: 100,
                    oxy_pri_storage: 100,
                    oxy_sec_storage: 100,
                    oxy_pri_pressure: 100,
                    oxy_sec_pressure: 100,
                    oxy_time_left: 100,
                    heart_rate: 80,
                    oxy_consumption: 1,
                    co2_production: 1,
                    suit_pressure_oxy: 100,
                    suit_pressure_co2: 0,
                    suit_pressure_other: 0,
                    suit_pressure_total: 100,
                    fan_pri_rpm: 1000,
                    fan_sec_rpm: 0,
                    helmet_pressure_co2: 0,
                    scrubber_a_co2_storage: 0,
                    scrubber_b_co2_storage: 0,
                    temperature: 70,
                    coolant_ml: 100,
                    coolant_gas_pressure: 100,
                    coolant_liquid_pressure: 100
                }
            }
        };

        print("[IngressSimulator] TSS data initialized");
    }

    private nextStep(): void {
        print(`[IngressSimulator] Moving to next step from ${this.currentStep}.${this.currentSubStep}`);
        const currentStepObj = this.steps[this.currentStep];
        const maxSubSteps = Object.keys(currentStepObj).length;

        if (this.currentSubStep < maxSubSteps) {
            this.currentSubStep++;
        } else if (this.currentStep < Object.keys(this.steps).length) {
            this.currentStep++;
            this.currentSubStep = 1;
        }

        print(`[IngressSimulator] Now at step ${this.currentStep}.${this.currentSubStep}`);
        this.simulateStepCompletion();
        this.updateDisplay();
    }

    private previousStep(): void {
        print(`[IngressSimulator] Moving to previous step from ${this.currentStep}.${this.currentSubStep}`);
        if (this.currentSubStep > 1) {
            this.currentSubStep--;
        } else if (this.currentStep > 1) {
            this.currentStep--;
            this.currentSubStep = Object.keys(this.steps[this.currentStep]).length;
        }

        print(`[IngressSimulator] Now at step ${this.currentStep}.${this.currentSubStep}`);
        this.simulateStepCompletion();
        this.updateDisplay();
    }

    private updateDisplay(): void {
        const stepMessage = this.steps[this.currentStep][this.currentSubStep];
        const progress = this.calculateProgress();
        this.statusText.text = `${stepMessage}\n\nProgress: ${progress}%`;
    }

    private calculateProgress(): number {
        let totalSteps = 0;
        let completedSteps = 0;

        for (const step of Object.values(this.steps)) {
            totalSteps += Object.keys(step).length;
        }

        for (let s = 1; s < this.currentStep; s++) {
            completedSteps += Object.keys(this.steps[s]).length;
        }
        completedSteps += this.currentSubStep;

        return Math.round((completedSteps / totalSteps) * 100);
    }

    private simulateStepCompletion(): void {
        // Get current state
        if (!this.uiaData?.uia || !this.dcuData?.dcu || !this.telemetryData?.telemetry) {
            print("[IngressSimulator] ERROR: TSS data or its components are undefined!");
            return;
        }

        print(`[IngressSimulator] Current states before update:
            UIA: eva1_power=${this.uiaData.uia.eva1_power}, oxy_vent=${this.uiaData.uia.oxy_vent}, eva1_water_waste=${this.uiaData.uia.eva1_water_waste}
            DCU: batt=${this.dcuData.dcu.eva1.batt}, pump=${this.dcuData.dcu.eva1.pump}
            Telemetry: oxy_pri=${this.telemetryData.telemetry.eva1.oxy_pri_storage}, coolant=${this.telemetryData.telemetry.eva1.coolant_ml}`);

        // Update states based on current step
        switch (this.currentStep) {
            case 1:
                if (this.currentSubStep === 1) {
                    this.uiaData.uia.eva1_power = true;
                    this.dcuData.dcu.eva1.batt = true;  // Set to umbilical
                    print("[IngressSimulator] Step 1.1: Setting eva1_power and batt to true");
                }
                break;

            case 2:
                if (this.currentSubStep === 1) {
                    this.uiaData.uia.oxy_vent = true;
                    print("[IngressSimulator] Step 2.1: Setting oxy_vent to true");
                } else if (this.currentSubStep === 2) {
                    // Simulate tanks draining
                    this.telemetryData.telemetry.eva1.oxy_pri_storage = 5;
                    this.telemetryData.telemetry.eva1.oxy_sec_storage = 5;
                    print("[IngressSimulator] Step 2.2: Setting oxygen levels to 5");
                } else if (this.currentSubStep === 3) {
                    this.uiaData.uia.oxy_vent = false;
                    print("[IngressSimulator] Step 2.3: Setting oxy_vent to false");
                }
                break;

            case 3:
                if (this.currentSubStep === 1) {
                    this.dcuData.dcu.eva1.pump = true;
                    print("[IngressSimulator] Step 3.1: Setting pump to true");
                } else if (this.currentSubStep === 2) {
                    this.uiaData.uia.eva1_water_waste = true;
                    print("[IngressSimulator] Step 3.2: Setting eva1_water_waste to true");
                } else if (this.currentSubStep === 3) {
                    // Simulate coolant draining
                    this.telemetryData.telemetry.eva1.coolant_ml = 2;
                    print("[IngressSimulator] Step 3.3: Setting coolant to 2ml");
                } else if (this.currentSubStep === 4) {
                    this.uiaData.uia.eva1_water_waste = false;
                    print("[IngressSimulator] Step 3.4: Setting eva1_water_waste to false");
                }
                break;

            case 4:
                if (this.currentSubStep === 1) {
                    this.uiaData.uia.eva1_power = false;
                    print("[IngressSimulator] Step 4.1: Setting eva1_power to false");
                } else if (this.currentSubStep === 2) {
                    this.dcuData.dcu.eva1.batt = false;  // Set back to local battery
                    print("[IngressSimulator] Step 4.2: Setting batt to false (local)");
                }
                break;
        }
    }
} 