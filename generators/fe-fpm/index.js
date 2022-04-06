const Generator = require("yeoman-generator");
const ui5Writer = require("@sap-ux/ui5-application-writer");
const fpmWriter = require("@sap-ux/fe-fpm-writer");

module.exports = class extends Generator {
    static displayName = "Create a new Fiori element flexible program model project";

    async prompting() {
        this.answers =  await this.prompt([
            {
                type: "input",
                name: "projectname",
                message: "How do you want to name this project?",
                validate: (s) => {
                    if (/^\d*[a-zA-Z][a-zA-Z0-9]*$/g.test(s)) {
                        return true;
                    }
                    return "Please use alpha numeric characters only for the project name.";
                },
                default: "myUI5App"
            },
            {
                type: "input",
                name: "namespaceUI5",
                message: "Which namespace do you want to use?",
                validate: (s) => {
                    if (/^[a-zA-Z0-9_\.]*$/g.test(s)) {
                        return true;
                    }
                    return "Please use alpha numeric characters and dots only for the namespace.";
                },
                default: "com.myorg"
            },
            {
                type: "input",
                name: "viewname",
                message: "What is the name of the main view?",
                validate: (s) => {
                    if (/^\d*[a-zA-Z][a-zA-Z0-9]*$/g.test(s)) {
                        return true;
                    }
                    return "Please use alpha numeric characters only for the view name.";
                },
                default: 'Main'
            }]);
    }

    async writing() {
        this.destinationRoot(this.answers.projectname);
        ui5Writer.generate(this.destinationRoot(), {
            app: {
                id: this.answers.projectname
            },
            package: {
                name: `${this.answers.namespaceUI5}.${this.answers.projectname}`
            }
        }, this.fs);
        fpmWriter.enableFPM(this.destinationRoot(), {
            replaceAppComponent: true
        }, this.fs);

        fpmWriter.generateCustomPage(
            this.destinationRoot(),
            {
                name: this.answers.viewname,
                entity: 'FakeEntity'
            },
            this.fs
        );
    }
}