import { validateAlphaNumericStartingWithLetterNonEmpty } from "../helpers.js"

export default async function prompts() {

	this.options.config.testName = (await this.prompt({
		type: "input",
		name: "testName",
		message: "How do you want to name your new journey?",
		validate: validateAlphaNumericStartingWithLetterNonEmpty
	})).testName
	
	this.options.config.viewName = (await this.prompt({
		type: "input",
		name: "viewName",
		message: "What is the name of the view you want to test?",
		validate: validateAlphaNumericStartingWithLetterNonEmpty
	})).viewName
}
