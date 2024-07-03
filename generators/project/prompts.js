import {
	validateAlphaNumericStartingWithLetterNonEmpty,
	validateAlphaNumericAndDotsNonEmpty
} from "../helpers.js"

export default async function prompts() {
    this.answers.namespaceUI5 = (await this.prompt({
        type: "input",
        name: "namespaceUI5",
        message: "Which namespace do you want to use?",
        validate: validateAlphaNumericAndDotsNonEmpty,
        default: "com.myorg"
    })).namespaceUI5

    this.answers.projectName = (await this.prompt({
        type: "input",
        name: "projectName",
        message: "How do you want to name this project?",
        validate: validateAlphaNumericStartingWithLetterNonEmpty,
        default: "myui5project"
    })).projectName

    // the project generator always runs together with the uimodule generator, so it makes sense to ask this question straight away
    this.answers.uimoduleName = (await this.prompt({
        type: "input",
        name: "uimoduleName",
        message: "How do you want to name the first uimodule within your project?",
        validate: validateAlphaNumericStartingWithLetterNonEmpty,
        default: "myui5app"
    })).uimoduleName

    this.answers.enableFPM = (await this.prompt({
        type: "confirm",
        name: "enableFPM",
        message: "Do you want to enable the SAP Fiori elements flexible programming model?",
        default: false
    })).enableFPM

    this.answers.enableTypescript = (await this.prompt({
        type: "confirm",
        name: "enableTypescript",
        message: "Do you want to use the awesomeness of TypeScript?",
        default: true,
        when: this.answers.enableFPM
    })).enableTypescript

    this.answers.enableFioriTools = (await this.prompt({
        type: "confirm",
        name: "enableFioriTools",
        message: "Do you want the module to be visible in the SAP Fiori tools?",
        default: true,
        when: this.answers.enableFPM
    })).enableFioriTools

    this.answers.platform = (await this.prompt({
        type: "list",
        name: "platform",
        message: "On which platform would you like to host the application?",
        choices: [
            "Static webserver",
            "Application Router",
            "SAP HTML5 Application Repository Service",
            "SAP Build Work Zone, standard edition",
			"SAP NetWeaver"
        ],
        default: "Static webserver"
    })).platform

    this.answers.tileName = (await this.prompt({
        type: "input",
        name: "tileName",
        message: "What name should be displayed on the Fiori Launchpad tile?",
        default: this.answers.uimoduleName,
        when: this.answers.platform === "SAP Build Work Zone, standard edition",
    })).tileName

    this.answers.ui5Libs = (await this.prompt({
        type: "list",
        name: "ui5Libs",
        message: "Where should your UI5 libs be served from?",
        choices: () => {
            return this.answers.platform !== "SAP Build Work Zone, standard edition" && !this.answers.enableFPM 
                ? [
                      "Content delivery network (OpenUI5)",
                      "Content delivery network (SAPUI5)",
                      "Local resources (OpenUI5)",
                      "Local resources (SAPUI5)"
                  ]
                : ["Local resources (SAPUI5)"]
        },
        default: () => {
            return this.answers.platform !== "SAP Build Work Zone, standard edition" && !this.answers.enableFPM
                ? "Content delivery network (OpenUI5)"
                : "Local resources (SAPUI5)"
        }
    })).ui5Libs

    this.answers.newDir = (await this.prompt({
        type: "confirm",
        name: "newDir",
        message: "Would you like to create a new directory for the project?",
        default: true
    })).newDir

    this.answers.initRepo = (await this.prompt({
        type: "confirm",
        name: "initRepo",
        message: "Would you like to initialize a local git repository for the project?",
        default: true
    })).initRepo
}
