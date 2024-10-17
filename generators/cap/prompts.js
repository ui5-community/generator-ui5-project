import {
	validateAlphaNumericStartingWithLetterNonEmpty
} from "../helpers.js"
import capabilities from "./capabilities.js"

export default async function prompts() {

	this.options.config.capName = (await this.prompt({
		type: "input",
		name: "capName",
		message: "How do you want to name your new SAP CAP server module?",
		default: "server",
		validate: validateAlphaNumericStartingWithLetterNonEmpty
	})).capName

	this.options.config.capCapabilities = (await this.prompt({
		type: "checkbox",
		name: "capCapabilities",
		message: "Which CAP capabilities do you want to add?",
		choices: capabilities.map(capability => ({ name: capability.name, value: capability.name, checked: capability.checked })),
	})).capCapabilities
	
	this.options.config.runModelSubgenerator = (await this.prompt({
		type: "confirm",
		name: "runModelSubgenerator",
		message: "Do you want to add the SAP CAP service as the default model to your uimodule?",
		default: true
	})).runModelSubgenerator
}
