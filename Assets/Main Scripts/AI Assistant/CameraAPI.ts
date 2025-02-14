// Type declarations for browser APIs
interface EventRegistration {
    add(callback: (...args: any[]) => void): number;
    remove(id: number): void;
}

interface Button extends ScriptComponent {
    onTouchStart: EventRegistration;
}

interface Blob {
    size: number;
    type: string;
}

interface FormData {
    append(name: string, value: string | Blob): void;
}

interface TextEncoder {
    encode(input?: string): Uint8Array;
}

interface Crypto {
    subtle: {
        digest(algorithm: string, data: Uint8Array): Promise<ArrayBuffer>;
    };
}

declare const FormData: {
    new(): FormData;
};

declare const TextEncoder: {
    new(): TextEncoder;
};

declare const crypto: Crypto;

import { Interactable } from "SpectaclesInteractionKit/Components/Interaction/Interactable/Interactable";
import { validate } from "SpectaclesInteractionKit/Utils/validate";

let cameraModule = require('LensStudio:CameraModule');

@component
export class CameraCaptureManager extends BaseScriptComponent {
    @input
    @hint("The image that shows the live camera preview")
    previewImage: Image | undefined;

    @input
    @hint("The image that will display the captured photo")
    capturedImage: Image | undefined;

    @input
    @hint("Button to trigger photo capture")
    captureButton!: Interactable;

    private cameraTexture: Texture | undefined;
    private cameraTextureProvider: CameraTextureProvider | undefined;
    private capturedTexture: Texture | undefined;

    onAwake() {
        // Validate required inputs
        validate(this.captureButton);

        this.createEvent("OnStartEvent").bind(() => {
            this.initializeCamera();
            this.setupCaptureButton();
        });
    }

    private initializeCamera() {
        const cameraRequest = CameraModule.createCameraRequest();
        cameraRequest.cameraId = CameraModule.CameraId.Default_Color;
        
        this.cameraTexture = cameraModule.requestCamera(cameraRequest);
        this.cameraTextureProvider = this.cameraTexture.control as CameraTextureProvider;

        this.cameraTextureProvider.onNewFrame.add(() => {
            try {
                if (this.previewImage && this.cameraTexture) {
                    this.previewImage.mainPass.baseTex = this.cameraTexture;
                }
            } catch (error) {
                print("Error setting camera preview texture: " + error);
            }
        });
    }
    
    private setupCaptureButton() {
        // Use onTriggerEnd like in MenuManager for consistent behavior
        this.captureButton.onTriggerEnd.add(() => {
            try {
                this.captureCurrentFrame();
            } catch (error) {
                print("Error capturing frame: " + error);
            }
        });
    }

    private captureCurrentFrame() {
        if (!this.cameraTexture || !this.capturedImage) {
            print("Camera texture or captured image not available");
            return;
        }

        // Store the current frame in the captured texture
        this.capturedTexture = this.cameraTexture;
        this.capturedImage.mainPass.baseTex = this.capturedTexture;
        print("Frame captured successfully!");
    }
}