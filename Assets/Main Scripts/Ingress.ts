import { TSSData } from './TSS_Data';
import { validate } from "../SpectaclesInteractionKit/Utils/validate";
import { IngressSimulator } from './IngressSimulator';

interface StepState {
    [key: number]: boolean;
}

interface Steps {
    [key: number]: StepState;
}

@component
export class Ingress extends BaseScriptComponent {
    // UI Components
    @input EMU1_POWER!: SceneObject;
    @input EV1_SUPPLY!: SceneObject;
    @input EV1_WASTE!: SceneObject;
    @input EV2_SUPPLY!: SceneObject;
    @input EV2_WASTE!: SceneObject;
    @input EMU2_POWER!: SceneObject;
    @input EMU1_OXY!: SceneObject;
    @input EMU2_OXY!: SceneObject;
    @input O2_VENT!: SceneObject;
    @input DEPRESS_PUMP!: SceneObject;
    @input simulator!: IngressSimulator;  // Reference to the simulator
    @input text!: Text;

    private steps: Steps = {};
    private lastSimulatorStep: number = 1;
    private lastSimulatorSubStep: number = 1;

    onAwake(): void {
        validate(this.simulator);
        print("[Ingress] Initialized with simulator");

        this.createEvent('UpdateEvent').bind(this.onUpdate.bind(this))
        this.initializeSteps();
    }

    onUpdate(): void {
        this.executeSteps();
    }

    private initializeSteps(): void {
        // Initialize UI components
        this.EMU1_POWER.enabled = false;
        this.EV1_SUPPLY.enabled = false;
        this.EV1_WASTE.enabled = false;
        this.EV2_SUPPLY.enabled = false;
        this.EV2_WASTE.enabled = false;
        this.EMU2_POWER.enabled = false;
        this.EMU1_OXY.enabled = false;
        this.EMU2_OXY.enabled = false;
        this.O2_VENT.enabled = false;
        this.DEPRESS_PUMP.enabled = false;

        // Initialize step states
        this.steps[1] = { 1: false, 2: false, 3: false };
        this.steps[2] = { 1: false, 2: false, 3: false };
        this.steps[3] = { 1: false, 2: false, 3: false, 4: false };
        this.steps[4] = { 1: false, 2: false };
    }

    private executeSteps(): void {
        // Validate simulator data is available
        if (!this.simulator?.uiaData?.uia || !this.simulator?.dcuData?.dcu || !this.simulator?.telemetryData?.telemetry) {
            print("[Ingress] ERROR: Simulator data is undefined!");
            this.text.text = "Error: Simulator data unavailable";
            return;
        }

        // Check if simulator step has changed
        if (this.simulator.currentStep !== this.lastSimulatorStep || 
            this.simulator.currentSubStep !== this.lastSimulatorSubStep) {
            
            // Reset all UI components first
            this.resetUIComponents();

            // Reset completion state for all steps after the current simulator step
            for (let step = this.simulator.currentStep + 1; step <= 4; step++) {
                for (let subStep in this.steps[step]) {
                    this.steps[step][subStep] = false;
                }
            }

            // Reset completion state for substeps after current simulator substep in current step
            for (let subStep in this.steps[this.simulator.currentStep]) {
                if (parseInt(subStep) > this.simulator.currentSubStep) {
                    this.steps[this.simulator.currentStep][subStep] = false;
                }
            }

            // When going backwards, we need to verify the completion state of the current step
            if (this.simulator.currentStep < this.lastSimulatorStep || 
                (this.simulator.currentStep === this.lastSimulatorStep && 
                 this.simulator.currentSubStep < this.lastSimulatorSubStep)) {
                // Reset current step's completion state
                for (let subStep = 1; subStep <= this.simulator.currentSubStep; subStep++) {
                    this.steps[this.simulator.currentStep][subStep] = false;
                }
            }

            this.lastSimulatorStep = this.simulator.currentStep;
            this.lastSimulatorSubStep = this.simulator.currentSubStep;
        }

        // Update UI and handle current step
        switch (this.simulator.currentStep) {
            case 1:
                this.handleStep1();
                break;
            case 2:
                this.handleStep2();
                break;
            case 3:
                this.handleStep3();
                break;
            case 4:
                this.handleStep4();
                break;
        }
    }

    private resetUIComponents(): void {
        this.EMU1_POWER.enabled = false;
        this.EV1_SUPPLY.enabled = false;
        this.EV1_WASTE.enabled = false;
        this.EV2_SUPPLY.enabled = false;
        this.EV2_WASTE.enabled = false;
        this.EMU2_POWER.enabled = false;
        this.EMU1_OXY.enabled = false;
        this.EMU2_OXY.enabled = false;
        this.O2_VENT.enabled = false;
        this.DEPRESS_PUMP.enabled = false;
    }

    private handleStep1(): void {
        if (!this.steps[1][1] && this.simulator.currentSubStep >= 1) {
            this.text.text = "Connect EV-1 UIA and DCU umbilical.";
            const eva1Power = this.simulator.uiaData.uia.eva1_power;
            print(`[Ingress] Step 1.1 - eva1_power: ${eva1Power}`);
            this.EMU1_POWER.enabled = !eva1Power;
            if (!eva1Power) return;
            if (!this.dcu_batt_msg(true)) return;
            this.steps[1][1] = true;
        }

        if (!this.steps[1][2] && this.simulator.currentSubStep >= 2) {
            this.steps[1][2] = true;
        }

        if (!this.steps[1][3] && this.simulator.currentSubStep >= 3) {
            this.steps[1][3] = true;
        }
    }

    private handleStep2(): void {
        if (!this.steps[2][1] && this.simulator.currentSubStep >= 1) {
            this.text.text = "Open O2 vent.";
            const oxyVent = this.simulator.uiaData.uia.oxy_vent;
            print(`[Ingress] Step 2.1 - oxy_vent: ${oxyVent}`);
            this.O2_VENT.enabled = !oxyVent;
            if (!oxyVent) return;
            this.steps[2][1] = true;
        }

        if (!this.steps[2][2] && this.simulator.currentSubStep >= 2) {
            const p1 = this.simulator.telemetryData.telemetry.eva1.oxy_pri_storage;
            const s1 = this.simulator.telemetryData.telemetry.eva1.oxy_sec_storage;
            print(`[Ingress] Step 2.2 - oxy_pri_storage: ${p1}, oxy_sec_storage: ${s1}`);
            this.text.text = `eva1 primary: ${p1} secondary: ${s1}`;
            const empty = p1 < 10 && s1 < 10;
            if (!empty) return;
            this.steps[2][2] = true;
        }

        if (!this.steps[2][3] && this.simulator.currentSubStep >= 3) {
            this.text.text = "Close O2 vent.";
            const oxyVent = this.simulator.uiaData.uia.oxy_vent;
            print(`[Ingress] Step 2.3 - oxy_vent: ${oxyVent}`);
            this.O2_VENT.enabled = oxyVent;
            if (oxyVent) return;
            this.steps[2][3] = true;
        }
    }

    private handleStep3(): void {
        if (!this.steps[3][1] && this.simulator.currentSubStep >= 1) {
            if (!this.dcu_pump_msg(true)) return;
            this.steps[3][1] = true;
        }

        if (!this.steps[3][2] && this.simulator.currentSubStep >= 2) {
            this.text.text = "Open EV-1 waste water.";
            const waterWaste = this.simulator.uiaData.uia.eva1_water_waste;
            print(`[Ingress] Step 3.2 - eva1_water_waste: ${waterWaste}`);
            this.EV1_WASTE.enabled = !waterWaste;
            if (!waterWaste) return;
            this.steps[3][2] = true;
        }

        if (!this.steps[3][3] && this.simulator.currentSubStep >= 3) {
            const coolant = this.simulator.telemetryData.telemetry.eva1.coolant_ml;
            print(`[Ingress] Step 3.3 - coolant_ml: ${coolant}`);
            this.text.text = `Coolant: ${coolant}.`;
            if (coolant > 5) return;
            this.steps[3][3] = true;
        }

        if (!this.steps[3][4] && this.simulator.currentSubStep >= 4) {
            this.text.text = "Close EV-1 waste water.";
            const waterWaste = this.simulator.uiaData.uia.eva1_water_waste;
            print(`[Ingress] Step 3.4 - eva1_water_waste: ${waterWaste}`);
            this.EV1_WASTE.enabled = waterWaste;
            if (waterWaste) return;
            this.steps[3][4] = true;
        }
    }

    private handleStep4(): void {
        if (!this.steps[4][1] && this.simulator.currentSubStep >= 1) {
            this.text.text = "Toggle EV-1 EMU PWR off.";
            const eva1Power = this.simulator.uiaData.uia.eva1_power;
            print(`[Ingress] Step 4.1 - eva1_power: ${eva1Power}`);
            this.EMU1_POWER.enabled = eva1Power;
            if (eva1Power) return;
            this.steps[4][1] = true;
        }

        if (!this.steps[4][2] && this.simulator.currentSubStep >= 2) {
            if (!this.dcu_batt_msg(false)) return;
            this.steps[4][2] = true;
            this.text.text = "Ingress Complete!";
        }
    }

    private dcu_batt_msg(mode: boolean): boolean {
        const modeText = mode ? "umbilical" : "local";
        if (!this.simulator?.dcuData?.dcu?.eva1) {
            print("[Ingress] ERROR: DCU data is undefined!");
            return false;
        }
        const battState = this.simulator.dcuData.dcu.eva1.batt;
        print(`[Ingress] DCU batt check - current: ${battState}, expected: ${mode}`);
        if (battState !== mode) {
            this.text.text = `Switch DCU batt to ${modeText}. `;
            return false;
        }
        return true;
    }

    private dcu_oxy_msg(mode: boolean): boolean {
        const modeText = mode ? "primary" : "secondary";
        if (!this.simulator?.dcuData?.dcu?.eva1) {
            print("[Ingress] ERROR: DCU data is undefined!");
            return false;
        }
        const oxyState = this.simulator.dcuData.dcu.eva1.oxy;
        if (oxyState !== mode) {
            this.text.text = `Switch DCU oxy to ${modeText}. `;
            return false;
        }
        return true;
    }

    private dcu_comm_msg(mode: boolean): boolean {
        const modeText = mode ? "A" : "B";
        if (!this.simulator?.dcuData?.dcu?.eva1) {
            print("[Ingress] ERROR: DCU data is undefined!");
            return false;
        }
        const commState = this.simulator.dcuData.dcu.eva1.comm;
        if (commState !== mode) {
            this.text.text = `Switch DCU comm to ${modeText}. `;
            return false;
        }
        return true;
    }

    private dcu_fan_msg(mode: boolean): boolean {
        const modeText = mode ? "primary" : "secondary";
        if (!this.simulator?.dcuData?.dcu?.eva1) {
            print("[Ingress] ERROR: DCU data is undefined!");
            return false;
        }
        const fanState = this.simulator.dcuData.dcu.eva1.fan;
        if (fanState !== mode) {
            this.text.text = `Switch DCU fan to ${modeText}. `;
            return false;
        }
        return true;
    }

    private dcu_pump_msg(mode: boolean): boolean {
        const modeText = mode ? "open" : "closed";
        if (!this.simulator?.dcuData?.dcu?.eva1) {
            print("[Ingress] ERROR: DCU data is undefined!");
            return false;
        }
        const pumpState = this.simulator.dcuData.dcu.eva1.pump;
        if (pumpState !== mode) {
            this.text.text = `Switch DCU pump to ${modeText}. `;
            return false;
        }
        return true;
    }

    private dcu_co2_msg(mode: boolean): boolean {
        const modeText = mode ? "A" : "B";
        if (!this.simulator?.dcuData?.dcu?.eva1) {
            print("[Ingress] ERROR: DCU data is undefined!");
            return false;
        }
        const co2State = this.simulator.dcuData.dcu.eva1.co2;
        if (co2State !== mode) {
            this.text.text = `Switch DCU co2 to ${modeText}. `;
            return false;
        }
        return true;
    }
} 