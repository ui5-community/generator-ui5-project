import dependencies from "../dependencies.js"
import Generator from "yeoman-generator"

export default class extends Generator {
    writing() {
        const platformIsWebserver = this.config.get("platform") === "Static webserver"
        const platformIsApprouter = this.config.get("platform") === "Application Router"
        const platformIsHTML5AppsRepo = this.config.get("platform") === "SAP HTML5 Application Repository Service"
        const platformIsSAPBuildWorkZone = this.config.get("platform") === "SAP Build Work Zone, standard edition"
        
        if (platformIsWebserver) {
            this.fs.copyTpl(
                this.templatePath("static"),
                this.destinationRoot(),
                {
                    projectId: this.config.get("projectId")
                }
            )
        } else if (platformIsApprouter) {
            this.fs.copyTpl(
                this.templatePath("standalone-approuter"),
                this.destinationRoot(),
                {
                    projectId: this.config.get("projectId"),
                    approuterVersion: dependencies["@sap/approuter"]
                }
            )
        } else if (platformIsHTML5AppsRepo || platformIsSAPBuildWorkZone) {
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
        }
    }
}
