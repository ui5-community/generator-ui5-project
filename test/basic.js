import assert from "yeoman-assert";
import path from "path";
import helpers from "yeoman-test";
import { execaCommandSync } from "execa";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IsCIRun = process.env.CI;

function generate(prompts) {
    const context = helpers.run(path.join(__dirname, "../generators/app"));
    context.withPrompts({
        newdir: false,
        ...prompts
    });
    return context;
}

function createTest(oPrompt) {
    let testDescription = Object.values(oPrompt).join("-");
    describe(testDescription, function () {
        this.timeout(200000);
        let context;
        before(async () => {
            context = await generate(oPrompt)
        });

        after(() => {
            context.restore();
        });
        
        it("should create the necessary ui5 files", function () {
            return assert.file([
                "uimodule/ui5.yaml",
                `uimodule/webapp/view/MainView.view.${oPrompt.viewtype.toLowerCase()}`,
                "uimodule/webapp/index.html",
                "uimodule/webapp/manifest.json"
            ]);
        });

        // regular easy-ui5 is used for scaffolding
        if (oPrompt.viewtype !== "XML") {
            it("should reference the base controller", function () {
                return assert.fileContent(
                    "uimodule/webapp/controller/MainView.controller.js",
                    "controller/BaseController"
                );
            });
        }

        if (
            !!oPrompt.platform &&
            oPrompt.platform !== "Static webserver" &&
            oPrompt.platform !== "SAP NetWeaver" &&
            oPrompt.platform !== "Application Router @ SAP HANA XS Advanced"
        ) {
            it("ui5.yaml middleware should point to the right xs-app.json file", function () {
                return assert.fileContent(
                    "uimodule/ui5.yaml",
                    oPrompt.platform === "Application Router @ Cloud Foundry"
                        ? "xsappJson: ../approuter/xs-app.json"
                        : "xsappJson: webapp/xs-app.json"
                );
            });
        }

        if (
            !!oPrompt.platform &&
            oPrompt.platform === "SAP HTML5 Application Repository service for SAP BTP" &&
            oPrompt.platform === "SAP Launchpad service"
        ) {
            it("ui5.yaml should leverage the ui5 zipper task", function () {
                return assert.fileContent("uimodule/ui5.yaml", "name: ui5-task-zipper");
            });
        }

        it("should create an installable project", function () {
            return execaCommandSync("npm install");
        });

        // run lint-fix after npm install, so that the npm test task won't fail
        it("should run lint-fix", function () {
            return execaCommandSync("npm run lint-fix");
        });

        it("should pass the OPA tests", function () {
            return execaCommandSync("npm test");
        });

        if (!!oPrompt.platform && oPrompt.platform !== "Static webserver" && oPrompt.platform !== "SAP NetWeaver") {
            it("should create a buildable project", async function () {
                try {
                    await execaCommandSync("npm run build:mta");
                } catch (e) {
                    throw new Error(e.stdout + "\n" + e.stderr);
                }
            });
        }
    });
}

describe("Basic project capabilities", function () {
    const testConfigurations = [
        {
            "viewtype": "XML"
        },
        {
            "viewtype": "JS",
            "platform": "Application Router @ Cloud Foundry"
        },
        {
            "viewtype": "JSON",
            "ui5libs": "Local resources (SAPUI5)"
        },
        {
            "viewtype": "JSON",
            "ui5libs": "Local resources (SAPUI5)",
            "platform": "SAP NetWeaver"
        },
        {
            "viewtype": "HTML",
            "ui5libs": "Local resources (OpenUI5)",
            "platform": "Application Router @ Cloud Foundry"
        },
        {
            "viewtype": "JSON",
            "platform": "SAP Launchpad service"
        },
        {
            "viewtype": "XML",
            "platform": "SAP HTML5 Application Repository service for SAP BTP"
        },
        {
            "viewtype": "XML",
            "platform": "SAP NetWeaver"
        },
        {
            "viewtype": "XML",
            "platform": "Application Router @ SAP HANA XS Advanced"
        },
        {
            "viewtype": "JS",
            "ui5libs": "Local resources (SAPUI5)",
            "platform": "SAP HTML5 Application Repository service for SAP BTP"
        },
        {
            "viewtype": "JSON",
            "ui5libs": "Local resources (OpenUI5)",
            "platform": "Application Router @ SAP HANA XS Advanced"
        },
        {
            "viewtype": "HTML",
            "platform": "SAP HTML5 Application Repository service for SAP BTP"
        },
        {
            "viewtype": "JS",
            "platform": "SAP HTML5 Application Repository service for SAP BTP"
        },
        {
            "viewtype": "JSON",
            "ui5libs": "Local resources (SAPUI5)",
            "platform": "Application Router @ SAP HANA XS Advanced"
        },
        {
            "viewtype": "JSON",
            "ui5libs": "Local resources (SAPUI5)",
            "platform": "SAP NetWeaver"
        },
        {
            "viewtype": "HTML",
            "ui5libs": "Local resources (OpenUI5)",
            "platform": "Application Router @ SAP HANA XS Advanced"
        },
        {
            "viewtype": "JS",
            "ui5libs": "Local resources (OpenUI5)",
            "platform": "SAP HTML5 Application Repository service for SAP BTP"
        }
    ]
    testConfigurations.forEach((testConfig, index) => {
        if (!IsCIRun) {
            createTest(testConfig);
            return;
        }
        const totalNodes = Number(process.env.NODES_TOTAL);
        const nodeIdx = Number(process.env.NODE_INDEX);
        const testsPerNode = Math.ceil(testConfigurations.length / totalNodes);
        const lowerBound = testsPerNode * nodeIdx;
        const upperBound = testsPerNode * (nodeIdx + 1);

        if (lowerBound <= index && index < upperBound) {
            createTest(testConfig);
        }
    });
});
