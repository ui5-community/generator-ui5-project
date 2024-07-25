import {
	validateAlphaNumericStartingWithLetterNonEmpty
} from "../helpers.js"

export default async function prompts() {

	this.options.config.capName = (await this.prompt({
		type: "input",
		name: "capName",
		message: "How do you want to name your new SAP CAP server module?",
		default: "server",
		validate: validateAlphaNumericStartingWithLetterNonEmpty
	})).capName
	
	this.options.config.runModelSubgenerator = (await this.prompt({
		type: "confirm",
		name: "runModelSubgenerator",
		message: "Do you want to add the SAP CAP service as the default model to your uimodule?",
		default: true
	})).runModelSubgenerator
}
