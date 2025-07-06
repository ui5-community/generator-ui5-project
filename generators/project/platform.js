import dependencies from "../dependencies.js"
import fs from "fs"
import Generator from "yeoman-generator"

export default class extends Generator {
	writing() {
		switch (this.config.get("platform")) {
			case "Static webserver":
				this.fs.copyTpl(
					this.templatePath("static"),
					this.destinationRoot(),
					{
						projectId: this.config.get("projectId")
					}
				)
				break

			case "Application Router":
				this.fs.copyTpl(
					this.templatePath("standalone-approuter"),
					this.destinationRoot(),
					{
						projectId: this.config.get("projectId"),
						approuterVersion: dependencies["@sap/approuter"]
					}
				)
				break
			
			case "Application Frontend Service":
				this.fs.copyTpl(
					this.templatePath("application-frontend/mta.yaml"),
					this.destinationPath("mta.yaml"),
					{
						projectId: this.config.get("projectId"),
						projectName: this.config.get("projectName")
					}
				)
				this.fs.copyTpl(
					this.templatePath("application-frontend/xs-security.json"),
					this.destinationPath("xs-security.json"),
					{
						projectId: this.config.get("projectId"),
						projectName: this.config.get("projectName")
					}
				)
				this.fs.copyTpl(
					this.templatePath("application-frontend/xs-app.json"),
					this.destinationPath(`${this.config.get("uimoduleName")}/webapp/xs-app.json`)
				)
				break

			case "SAP HTML5 Application Repository Service":
			case "SAP Build Work Zone, standard edition":
				this.fs.copyTpl(
					this.templatePath("managed-approuter/mta.yaml"),
					this.destinationPath("mta.yaml"),
					{
						projectId: this.config.get("projectId"),
						projectName: this.config.get("projectName")
					}
				)
				this.fs.copyTpl(
					this.templatePath("managed-approuter/xs-security.json"),
					this.destinationPath("xs-security.json"),
					{
						projectId: this.config.get("projectId"),
						projectName: this.config.get("projectName")
					}
				)
				this.fs.copyTpl(
					this.templatePath("managed-approuter/xs-app.json"),
					this.destinationPath(`${this.config.get("uimoduleName")}/webapp/xs-app.json`)
				)
				break

			case "SAP NetWeaver":
				const packageJSON = JSON.parse(fs.readFileSync(this.destinationPath("package.json")))
				delete packageJSON.scripts["deploy"]
				delete packageJSON.scripts["build"]
				delete packageJSON.dependencies["mbt"]
				fs.writeFileSync(this.destinationPath("package.json"), JSON.stringify(packageJSON, null, 4))
				break
		}
	}
}
