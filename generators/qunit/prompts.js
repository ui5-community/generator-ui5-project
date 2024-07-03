import { validateAlphaNumericStartingWithLetterNonEmpty } from "../helpers.js"

export default async function prompts() {

	this.options.config.testName = (await this.prompt({
		type: "input",
		name: "testName",
		message: "How do you want to name your new test?",
		validate: validateAlphaNumericStartingWithLetterNonEmpty
	})).testName

}
