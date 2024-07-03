import {
	validateAlphaNumericStartingWithLetterNonEmpty,
	validateAlphaNumericAndDotsNonEmpty
} from "../helpers.js"

export default async function prompts() {

	this.options.config.controlName = (await this.prompt({
		type: "input",
		name: "controlName",
		message: "How do you want to name your new custom control?",
		validate: validateAlphaNumericStartingWithLetterNonEmpty
	})).controlName
	
	this.options.config.superControl = (await this.prompt({
		type: "input",
		name: "superControl",
		message: "Which UI5 control would you like to extend?",
		default: "sap.ui.core.Control",
		validate: validateAlphaNumericAndDotsNonEmpty
	})).superControl

}
