import dependencies from "../dependencies.js"
import { ensureCorrectDestinationPath } from "../helpers.js"
import fs from "fs"
import Generator from "yeoman-generator"
import path, { dirname } from "path"
import { fileURLToPath } from "url"
const __dirname = dirname(fileURLToPath(import.meta.url))

export default class extends Generator {

	writing() {
		ensureCorrectDestinationPath.call(this)

		const uimodulePackageJson = JSON.parse(fs.readFileSync(this.destinationPath("package.json")))

		uimodulePackageJson["devDependencies"]["@ui5/linter"] = dependencies["@ui5/linter"]
		uimodulePackageJson["scripts"]["ui5lint"] = "ui5lint"

		if (!fs.existsSync(this.destinationPath(".eslintrc"))) {
			this.fs.copyTpl(
				// for some reason this.templatePath() doesn't work here
				path.join(__dirname, "templates/.eslintrc"),
				this.destinationPath(".eslintrc"),
				{}
			)
			uimodulePackageJson["devDependencies"]["@sap-ux/eslint-plugin-fiori-tools"] = dependencies["@sap-ux/eslint-plugin-fiori-tools"]
			uimodulePackageJson["scripts"]["lint"] = "eslint ./"
		}

		fs.writeFileSync(this.destinationPath("package.json"), JSON.stringify(uimodulePackageJson, null, 4))
	}
}
