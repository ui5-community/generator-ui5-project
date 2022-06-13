const assert = require("yeoman-assert");
const path = require("path");
const helpers = require("yeoman-test");

const config = require('dotenv').config()
if (config.error) {
  throw config.error
}

function generate(prompts) {
    const context = helpers.run(path.join(__dirname, "../generators/app"));
    if (process.env.TEST_DEBUG) {
        context.inDir(path.join(__dirname, 'test-output'));
    }
    context.withPrompts({
        namespaceUI5: "test",
        ...prompts
    });
    return context;
}

describe("open-ux-tools", function () {
    this.timeout(5000);

    describe("create a project using the fiori-freestyle-writer", () => {
        let context;
        before(async function () {
            context = await generate({
                projectname: "myFioriFreestylApp",
                viewtype: 'XML'
            });
        });

        after(() => {
            context.restore();
        });

        it("files that are not relevant for easy-ui5 are removed", () => {
            assert.noFile([
                "uimodule/package.json",
                "uimodule/ui5-local.yaml"
            ]);
        });

        it("all relevant files are generated", () => {
            assert.file([
                "uimodule/ui5.yaml",
                "uimodule/webapp/index.html",
                "uimodule/webapp/manifest.json",
                "uimodule/webapp/view/MainView.view.xml",
                "uimodule/webapp/controller/MainView.controller.js",
                "uimodule/webapp/view/App.view.xml",
                "uimodule/webapp/controller/App.controller.js"
            ]);
        });

        it("MainView contoller is extending the easy-ui5 BaseController", () => {
            assert.fileContent(
                "uimodule/webapp/controller/MainView.controller.js",
                "./BaseController"
            );
        });

        it("the flpSandbox.html is in test/ and bootstraps SAPUI5", () => {
            assert.file("uimodule/webapp/test/flpSandbox.html");
            assert.fileContent("uimodule/webapp/test/flpSandbox.html", "https://ui5.sap.com");
        });
    });

    describe("create project with the flexible programming model enabled", () => {
        let context;
        before(async function () {
            if (process.env.TEST_DEBUG) {
                context = await generate({
                    projectname: "myFPMApp",
                    enableFPM: true,
                    serviceUrl: process.env.TEST_SERVICE,
                    username: process.env.TEST_USERNAME,
                    password: process.env.TEST_PASSWORD,
                    mainEntity: "Product"
                });
            } else {
                console.log('Skipping debug tests');
                runTest = false;
            }
        });

        after(() => {
            context && context.restore();
        });

        it("dump it for now", () => {
            
        });
    });
});