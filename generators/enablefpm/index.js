const path = require("path");
const Generator = require("yeoman-generator");
const fpmWriter = require("@sap-ux/fe-fpm-writer");

module.exports = class extends Generator {
    static displayName = "Enables the Fiori elements flexible program model";

    async prompting() {
        const modules = this.config.get("uimodules") || [];
        this.answers = await this.prompt([
            {
                type: "list",
                name: "moduleName",
                message: "For which module do you want to enable FPM?",
                choices: modules,
                when: !!modules && modules.length > 1
            },
            {
                type: "confirm",
                name: "replaceComponent",
                message: "Do you want to replace your App Component?",
                default: false,
                when: !this.options.isSubgeneratorCall
            }]);

        this.config.set(this.answers);
    }

    writing() {
        fpmWriter.enableFPM(
            this.destinationPath(this.options.modulename || this.answers.moduleName || ''), {
                replaceAppComponent: this.options.isSubgeneratorCall || this.answers.replaceAppComponent 
            }, this.fs
        );
    }
}