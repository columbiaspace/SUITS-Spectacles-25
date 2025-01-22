import { Interactable } from "SpectaclesInteractionKit/Components/Interaction/Interactable/Interactable";
import { validate } from "../SpectaclesInteractionKit/Utils/validate";

/**
 * Menu Manager for handling menu transitions and button interactions
 */
@component
export class MenuManager extends BaseScriptComponent {
    // Main menu buttons that will toggle other menus
    @input mainMenuButton1!: Interactable;
    @input mainMenuButton2!: Interactable;
    @input mainMenuButton3!: Interactable;
    @input mainMenuButton4!: Interactable;
    @input mainMenuButton5!: Interactable;
    // Menu objects to toggle
    @input menu1!: SceneObject;
    @input menu2!: SceneObject;
    @input menu3!: SceneObject;
    @input menu4!: SceneObject;
    @input menu5!: SceneObject;

    onAwake(): void {
        // Validate all required inputs
        validate(this.mainMenuButton1);
        validate(this.mainMenuButton2);
        validate(this.mainMenuButton3);
        validate(this.mainMenuButton4);
        validate(this.menu1);
        validate(this.menu2);
        validate(this.menu3);
        validate(this.menu4);

        // Initially hide secondary menus
        this.menu1.enabled = false;
        this.menu2.enabled = false;
        this.menu3.enabled = false;
        this.menu4.enabled = false;
        this.menu5.enabled = false;

        // Bind button click events
        this.mainMenuButton1.onTriggerEnd.add(() => this.toggleMenu1());
        this.mainMenuButton2.onTriggerEnd.add(() => this.toggleMenu2());
        this.mainMenuButton3.onTriggerEnd.add(() => this.toggleMenu3());
        this.mainMenuButton4.onTriggerEnd.add(() => this.toggleMenu4());
        this.mainMenuButton5.onTriggerEnd.add(() => this.toggleMenu5());
    }

    private toggleMenu1(): void {
        this.menu1.enabled = !this.menu1.enabled;
        // Ensure other menu is closed when this one opens
    }

    private toggleMenu2(): void {
        this.menu2.enabled = !this.menu2.enabled;
        // Ensure other menu is closed when this one opens
    }

    private toggleMenu3(): void {
        this.menu3.enabled = !this.menu3.enabled;
    }

    private toggleMenu4(): void {
        this.menu4.enabled = !this.menu4.enabled;
    }

    private toggleMenu5(): void {
        this.menu5.enabled = !this.menu5.enabled;
    }   
}