"use strict";

const Generator = require("yeoman-generator"),
    fileaccess = require("../../helpers/fileaccess"),
    path = require("path"),
    chalk = require("chalk"),
    yosay = require("yosay"),
    glob = require("glob");

module.exports = class extends Generator {
    static displayName = "Create a new OpenUI5/SAPUI5 project";

    async prompting() {
        if (!this.options.embedded) {
            this.log(yosay(`Welcome to the ${chalk.red("easy-ui5-project")} generator!`));
        }

        const initialAnswers = await this.prompt([
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
                default: "myui5app"
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
                type: "confirm",
                name: "enableFPM",
                message: "Do you want to enable the SAP Fiori elements flexible programming model?",
                default: false
            }
        ]);

        initialAnswers.enableTypescript = (await this.prompt({
            type: "confirm",
            name: "enableTypescript",
            message: "Do you want to use the awesomeness of Typescript?",
            default: true,
            when: initialAnswers.enableFPM
        })).enableTypescript;

        const answers = await this.prompt([
            {
                type: "confirm",
                name: "enableFioriTools",
                message: "Do you want the module to be visible in the SAP Fiori tools?",
                default: true,
                when: initialAnswers.enableFPM
            },
            {
                type: "list",
                name: "platform",
                message: "On which platform would you like to host the application?",
                choices: [
                    "Static webserver",
                    "Application Router @ Cloud Foundry",
                    "SAP HTML5 Application Repository service for SAP BTP",
                    "SAP Launchpad service",
                    "Application Router @ SAP HANA XS Advanced",
                    "SAP NetWeaver"
                ],
                default: "Static webserver"
            },
            {
                type: "list",
                name: "viewtype",
                message: "Which view type do you want to use?",
                choices: ["XML", "JSON", "JS", "HTML"],
                default: "XML",
                when: !initialAnswers.enableFPM
            },
            {
                type: "list",
                name: "ui5libs",
                message: "Where should your UI5 libs be served from?",
                choices: (props) => {
                    return props.platform !== "SAP Launchpad service" && !initialAnswers.enableFPM // limit to SAPUI5 for some use cases
                        ? [
                              "Content delivery network (OpenUI5)",
                              "Content delivery network (SAPUI5)",
                              "Local resources (OpenUI5)",
                              "Local resources (SAPUI5)"
                          ]
                        : ["Content delivery network (SAPUI5)"];
                },
                default: (props) => {
                    return props.platform !== "SAP Launchpad service" && !initialAnswers.enableFPM
                        ? "Content delivery network (OpenUI5)"
                        : "Content delivery network (SAPUI5)";
                }
            },
            {
                type: "confirm",
                name: "newdir",
                message: "Would you like to create a new directory for the project?",
                default: true
            },
            {
                type: "confirm",
                name: "codeassist",
                message: "Would you like to add JavaScript code assist libraries to the project?",
                default: !initialAnswers.enableTypescript,
                when: !initialAnswers.enableTypescript
            },
            {
                type: "confirm",
                name: "initrepo",
                message: "Would you like to initialize a local git repository for the project?",
                default: true
            }
        ]);
        
        if (answers.newdir) {
            // ensure that the directory is created as a subdirectory of the current directory
            this.destinationRoot(this.destinationPath(`${initialAnswers.namespaceUI5}.${initialAnswers.projectname}`));
        }
        if (initialAnswers.enableFPM) {
            this.config.set('viewtype', 'XML');
        }
        
        this.config.set(initialAnswers);
        this.config.set(answers);
        this.config.set("namespaceURI", initialAnswers.namespaceUI5.split(".").join("/"));
    }

    async writing() {
        const oConfig = this.config.getAll();

        this.sourceRoot(path.join(__dirname, "templates"));
        glob.sync("**", {
            cwd: this.sourceRoot(),
            nodir: true
        }).forEach((file) => {
            const sOrigin = this.templatePath(file);
            const sTarget = this.destinationPath(file.replace(/^_/, "").replace(/\/_/, "/"));

            this.fs.copyTpl(sOrigin, sTarget, oConfig);
        });

        if (oConfig.codeassist) {
            let tsconfig = {
                compilerOptions: {
                    module: "none",
                    noEmit: true,
                    checkJs: true,
                    allowJs: true,
                    types: ["@sapui5/ts-types"],
                    lib: ["es2015"]
                }
            };

            await fileaccess.writeJSON.call(this, "/tsconfig.json", tsconfig);
        }

        const oSubGen = Object.assign({}, oConfig);
        oSubGen.isSubgeneratorCall = true;
        oSubGen.cwd = this.destinationRoot();
        oSubGen.modulename = "uimodule";

        if (oConfig.platform !== "Static webserver" && oConfig.platform !== "SAP NetWeaver") {
            this.composeWith(require.resolve("../additionalmodules"), oSubGen);
        }

        this.composeWith(require.resolve("../newwebapp"), oSubGen);
        if (oConfig.enableFPM) {
            this.composeWith(require.resolve("../enablefpm"), oSubGen);
            this.composeWith(require.resolve("../newfpmpage"), oSubGen);
        }
    }

    async addPackage() {
        const oConfig = this.config.getAll();
        let packge = {
            name: oConfig.projectname,
            version: "0.0.1",
            scripts: {
                start: `ui5 serve --config=uimodule/ui5.yaml  --open index.html${oConfig.enableFPM ? "?sap-ui-xx-viewCache=false": ""}`,
                "build:ui": "run-s ",
                test: "run-s lint karma",
                "karma-ci": "karma start karma-ci.conf.js",
                clearCoverage: "shx rm -rf coverage",
                karma: "run-s clearCoverage karma-ci",
                lint: "eslint ./**/webapp/**/*.js && prettier --plugin-search-dir=. --check ./**/webapp/**/*.{js,xml} --no-error-on-unmatched-pattern",
                "lint-fix": "eslint ./**/webapp/**/*.js --fix && prettier --plugin-search-dir=. --write ./**/webapp/**/*.{js,xml} --no-error-on-unmatched-pattern"
            },
            devDependencies: {
                shx: "^0.3.4",
                "@ui5/cli": "^3",
                "ui5-middleware-livereload": "latest",
                karma: "^6.4.2",
                "karma-chrome-launcher": "^3.2.0",
                "karma-coverage": "^2.2.0",
                "karma-ui5": "latest",
                "npm-run-all": "^4.1.5",
                eslint: "latest",
                prettier: "latest",
                "@prettier/plugin-xml": "latest"
            }
        };

        if (oConfig.platform !== "Static webserver" && oConfig.platform !== "SAP NetWeaver") {
            packge.devDependencies["ui5-middleware-cfdestination"] = "latest";
            (packge.devDependencies["ui5-task-zipper"] = "latest"), (packge.devDependencies["cross-var"] = "^1.1.0");
            packge.devDependencies["mbt"] = "latest";

            if (
                oConfig.platform === "Application Router @ Cloud Foundry" ||
                oConfig.platform === "SAP HTML5 Application Repository service for SAP BTP" ||
                oConfig.platform === "SAP Launchpad service"
            ) {
                packge.scripts["build:mta"] = "mbt build";
                packge.scripts[
                    "deploy:cf"
                ] = `cross-var cf deploy mta_archives/${oConfig.projectname}_$npm_package_version.mtar`;
                packge.scripts["deploy"] = "run-s build:mta deploy:cf";
            } else if (oConfig.platform === "Application Router @ SAP HANA XS Advanced") {
                packge.scripts["build:mta"] = "mbt build -p=xsa";
                packge.scripts[
                    "deploy:cf"
                ] = `cross-var xs deploy mta_archives/${oConfig.projectname}_$npm_package_version.mtar`;
                packge.scripts["deploy"] = "run-s build:mta deploy:xs";
            }

            if (oConfig.platform === "SAP Launchpad service") {
                packge.scripts.start = "ui5 serve --config=uimodule/ui5.yaml  --open test/flpSandbox.html";
            }
        }

        if (oConfig.platform === "SAP NetWeaver") {
            packge.devDependencies["ui5-task-nwabap-deployer"] = "*";
            packge.devDependencies["ui5-middleware-route-proxy"] = "*";
            packge.scripts["deploy"] = "run-s build:ui";
        }

        if (oConfig.codeassist) {
            packge.devDependencies["@sapui5/ts-types"] = "~1.108.0"; //keep this line in sync with ui5.yaml version
        }

        await fileaccess.writeJSON.call(this, "/package.json", packge);
    }

    install() {
        this.config.set("setupCompleted", true);
    }

    end() {
        // (skipInstall is true when executed in unit tests.)
        if (!this.env.options.skipInstall) {
            this.spawnCommandSync('npm', ['install'], {
                cwd: this.destinationPath()
            });
            // If the generator is properly installed, we have to run lint-fix to get properly formatted code
            this.spawnCommandSync("npm", ["run", "lint-fix"], {
                cwd: this.destinationPath()
            });
        }
        if (this.config.initrepo) {
            this.spawnCommandSync("git", ["init", "--quiet"], {
                cwd: this.destinationPath()
            });
            this.spawnCommandSync("git", ["add", "."], {
                cwd: this.destinationPath()
            });
            this.spawnCommandSync(
                "git",
                ["commit", "--quiet", "--allow-empty", "-m", "Initialize repository with easy-ui5"],
                {
                    cwd: this.destinationPath()
                }
            );
        }
    }
};
