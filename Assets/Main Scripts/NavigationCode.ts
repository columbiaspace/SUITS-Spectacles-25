import { Interactable } from "SpectaclesInteractionKit/Components/Interaction/Interactable/Interactable";
import { validate } from "SpectaclesInteractionKit/Utils/validate";

@component
export class NewScript extends BaseScriptComponent {

    @input dropPinButton!: Interactable;
    @input procButton!: Interactable;
    @input map!: SceneObject;

    onAwake() {
        validate(this.dropPinButton);
        validate(this.procButton);
        validate(this.map);

        this.map.enabled = false;
        this.procButton.onTriggerEnd.add(() => this.toggleMap());
    }

    private toggleMap(): void {
        this.map.enabled = !this.map.enabled;
    }
}


