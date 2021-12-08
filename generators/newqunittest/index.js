const Generator = require("yeoman-generator");
const jsUtils = require("../../helpers/jsutils");
const validFilename = require("valid-filename");
const fs = require("fs");

module.exports = class extends Generator {
    static displayName = "Add a new QUnit test to an existing test suite";

    prompting() {
        let aPrompt = [];
        this.options.oneTimeConfig = this.config.getAll();
        if (this.options.isSubgeneratorCall) {
            this.options.oneTimeConfig.projectname = this.options.projectname;
            this.options.oneTimeConfig.namespaceUI5Input = this.options.namespaceUI5Input;
            this.options.oneTimeConfig.modulename = this.options.modulename;
            this.options.oneTimeConfig.ui5libs = this.options.ui5libs;
            this.options.oneTimeConfig.appId = this.options.appId;
            this.options.oneTimeConfig.appURI = this.options.appURI;
        } else {
            if (!this.config.getAll().viewtype) {
                if (!this.options.oneTimeConfig.projectname) {
                    aPrompt = aPrompt.concat([
                        {
                            type: "input",
                            name: "projectname",
                            message:
                                "Seems like this project has not been generated with Easy-UI5. Please enter the name of your project.",
                            validate: (s) => {
                                if (/^[a-zA-Z][a-zA-Z0-9\.]*$/g.test(s)) {
                                    return true;
                                }
                                return "Please use only alpha numeric characters and dots for the project name.";
                            },
                            default: "myUI5App"
                        }
                    ]);

                    if (!this.options.oneTimeConfig.namespaceUI5Input) {
                        aPrompt = aPrompt.concat([
                            {
                                type: "input",
                                name: "namespaceUI5Input",
                                message: "Please enter the namespace you use currently",
                                validate: (s) => {
                                    if (/^[a-zA-Z0-9_\.]*$/g.test(s)) {
                                        return true;
                                    }
                                    return "Please use only alpha numeric characters, dots and underscores for the namespace.";
                                },
                                default: "com.myorg"
                            }
                        ]);
                    }
                }
            }
            if (!this.options.oneTimeConfig.ui5libs) {
                aPrompt = aPrompt.concat([
                    {
                        type: "list",
                        name: "ui5libs",
                        message: "Where should your UI5 libs be served from?",
                        choices: (props) => {
                            return props.platform !== "SAP Launchpad service"
                                ? [
                                      "Content delivery network (OpenUI5)",
                                      "Content delivery network (SAPUI5)",
                                      "Local resources"
                                  ]
                                : ["Content delivery network (SAPUI5)"];
                        },
                        default: (props) => {
                            return props.platform !== "SAP Launchpad service"
                                ? "Content delivery network (OpenUI5)"
                                : "Content delivery network (SAPUI5)";
                        }
                    }
                ]);
            }
            const modules = this.config.get("uimodules") || [];
            if (modules.length) {
                aPrompt.push({
                    type: "list",
                    name: "modulename",
                    message: "To which module do you want to add QUnit tests?",
                    choices: modules,
                    when: modules.length
                });
            }
        }

        aPrompt = aPrompt.concat([
            {
                type: "input",
                name: "codeUnderTest",
                message: "Code under test:",
                default: "./model/formatter"
            },
            {
                type: "input",
                name: "suiteName",
                message: "QUnit-Module:",
                default: "My QUnit tests"
            },
            {
                type: "input",
                name: "testName",
                message: "QUnit-Test:",
                default: "I should ..."
            },
            {
                type: "confirm",
                name: "useSinonJS",
                message: "Do you want to use Sinon.JS?",
                default: false
            },
            {
                type: "confirm",
                name: "asynchronousOp",
                message: "Do you want to test asynchronous operations?",
                default: false
            },
            {
                type: "confirm",
                name: "errorThrows",
                message: "Do you want to test if an exception is thrown?",
                default: false
            }
        ]);

        return this.prompt(aPrompt).then((answers) => {
            for (var key in answers) {
                this.options.oneTimeConfig[key] = answers[key];
            }

            const sModule =
                (this.options.oneTimeConfig.modulename ? this.options.oneTimeConfig.modulename + "/" : "") + "webapp/";
            const allTestsFile = this.destinationPath(sModule + "test/unit/AllTests.js");
            if (!fs.existsSync(allTestsFile)) {
                this.log("Info: You need to run the generator 'qunit' to create the test-suite.");
            }

            var appName =
                !this.options.oneTimeConfig.modulename || this.options.oneTimeConfig.modulename === "uimodule"
                    ? this.options.oneTimeConfig.projectname
                    : this.options.oneTimeConfig.modulename;
            this.options.oneTimeConfig.namespaceUI5Input =
                this.options.oneTimeConfig.namespaceUI5Input || this.options.oneTimeConfig.namespaceUI5;
            this.options.oneTimeConfig.namespaceURI = this.options.oneTimeConfig.namespaceUI5Input.split(".").join("/");
            this.options.oneTimeConfig.appId = this.options.oneTimeConfig.namespaceUI5Input + "." + appName;
            this.options.oneTimeConfig.appURI = this.options.oneTimeConfig.namespaceURI + "/" + appName;
            this.options.oneTimeConfig.title = appName;

            this.options.oneTimeConfig.codeUnderTest = jsUtils.transformToPathWithLeadingSlash(
                this.options.oneTimeConfig.codeUnderTest
            );

            let tests = this.config.get("qunittests") || [];
            let codeUnderTest = this.options.oneTimeConfig.codeUnderTest;

            this.options.oneTimeConfig.skipTest = tests.includes(codeUnderTest);
            if (!this.options.oneTimeConfig.skipTests) {
                tests.push(this.options.oneTimeConfig.codeUnderTest);
            }
            tests = jsUtils.removeDuplicates(tests || []);
            this.config.set("qunittests", tests);
            this.options.oneTimeConfig.qunittests = tests;
        });
    }

    async writing() {
        const sModule =
            (this.options.oneTimeConfig.modulename ? this.options.oneTimeConfig.modulename + "/" : "") + "webapp/";

        this.fs.copyTpl(
            this.templatePath("test/unit/$testFile.js"),
            this.destinationPath(sModule + "test/unit/" + this.options.oneTimeConfig.codeUnderTest + ".js"),
            this.options.oneTimeConfig
        );

        // add new qunit test to AllTests list
        if (!this.options.oneTimeConfig.skipTest) {
            const allTestsFile = this.destinationPath(sModule + "test/unit/AllTests.js");
            if (fs.existsSync(allTestsFile)) {
                const content = fs
                    .readFileSync(allTestsFile, "utf8")
                    .replace(
                        /sap.ui.define\(\[(.*)$\n\s*\]/gms,
                        `sap.ui.define([$1,\n\t".${this.options.oneTimeConfig.codeUnderTest}"\n]`
                    )
                    .replace(/\s,\s/, ",\n");
                fs.writeFileSync(allTestsFile, content);
            }
        }
    }
};
