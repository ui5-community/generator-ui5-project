import dependencies from "../dependencies.js"
import fs from "fs"
import Generator from "yeoman-generator"

export default class extends Generator {

	writing() {
		this.fs.copyTpl(
			this.options.templatePath,
			this.destinationPath(".eslintrc"),
			{}
		)
		const uimodulePackageJson = JSON.parse(fs.readFileSync(this.destinationPath("package.json")))
		uimodulePackageJson["devDependencies"]["@sap-ux/eslint-plugin-fiori-tools"] = dependencies["@sap-ux/eslint-plugin-fiori-tools"]
		uimodulePackageJson["scripts"]["lint"] = "eslint ./"
		fs.writeFileSync(this.destinationPath("package.json"), JSON.stringify(uimodulePackageJson, null, 4))

	}
}
