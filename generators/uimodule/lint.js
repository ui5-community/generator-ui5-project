import dependencies from "../dependencies.js"
import { ensureCorrectDestinationPath } from "../helpers.js"
import fs from "fs"
import Generator from "yeoman-generator"

export default class extends Generator {

	writing() {
		ensureCorrectDestinationPath.call(this)

		const uimodulePackageJson = JSON.parse(fs.readFileSync(this.destinationPath("package.json")))

		uimodulePackageJson["devDependencies"]["@ui5/linter"] = dependencies["@ui5/linter"]
		uimodulePackageJson["scripts"]["ui5lint"] = "ui5lint"

		fs.writeFileSync(this.destinationPath("package.json"), JSON.stringify(uimodulePackageJson, null, 4))
	}
}
