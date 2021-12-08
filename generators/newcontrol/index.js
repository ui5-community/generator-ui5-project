const Generator = require("yeoman-generator");

module.exports = class extends Generator {
    static displayName = "Add a new custom control to an existing project";

    prompting() {
        const modules = this.config.get("uimodules");
        var aPrompt = [
            {
                type: "list",
                name: "modulename",
                message: "To which module do you want to add a control?",
                choices: modules || [],
                when: !!modules && modules.length > 1
            },
            {
                type: "input",
                name: "controlname",
                message: "What is the name of the new control?",
                validate: (s) => {
                    if (/^\d*[a-zA-Z][a-zA-Z0-9]*$/g.test(s)) {
                        return true;
                    }
                    return "Please use alpha numeric characters only for the control name.";
                }
            },
            {
                type: "input",
                name: "supercontrol",
                message: "Which control would you like to extend?",
                validate: (s) => {
                    if (/^[a-zA-Z0-9\.]*$/g.test(s)) {
                        return true;
                    }
                    return "Please use alpha numeric characters and dots only to specifiy the super control.";
                },
                default: "sap.ui.core.Control"
            }
        ];
        if (!this.config.getAll().viewtype) {
            aPrompt = aPrompt.concat([
                {
                    type: "input",
                    name: "projectname",
                    message:
                        "Seems like this project has not been generated with Easy-UI5. Please enter the name your project.",
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
                    message: "Please enter the namespace you use currently",
                    validate: (s) => {
                        if (/^[a-zA-Z0-9_\.]*$/g.test(s)) {
                            return true;
                        }
                        return "Please use alpha numeric characters and dots only for the namespace.";
                    },
                    default: "com.myorg"
                }
            ]);
        }
        return this.prompt(aPrompt).then((answers) => {
            this.options.oneTimeConfig = this.config.getAll();

            if (answers.projectname) {
                this.options.oneTimeConfig.projectname = answers.projectname;
                this.options.oneTimeConfig.namespaceUI5 = answers.namespaceUI5;
            }
            this.options.oneTimeConfig.controlname = answers.controlname;
            this.options.oneTimeConfig.supercontrol = answers.supercontrol;
            this.options.oneTimeConfig.modulename = answers.modulename || (!!modules ? modules[0] : "");

            this.options.oneTimeConfig.appId =
                this.options.oneTimeConfig.namespaceUI5 +
                "." +
                (this.options.modulename === "uimodule" || !this.options.oneTimeConfig.modulename
                    ? this.options.oneTimeConfig.projectname
                    : this.options.modulename);
        });
    }

    writing() {
        const sOrigin = this.templatePath("webapp/control/template.js");
        const sTarget = this.destinationPath(
            `${
                this.options.oneTimeConfig.modulename ? this.options.oneTimeConfig.modulename + "/" : ""
            }webapp/control/${this.options.oneTimeConfig.controlname}.js`
        );

        this.fs.copyTpl(sOrigin, sTarget, this.options.oneTimeConfig);
    }
};
