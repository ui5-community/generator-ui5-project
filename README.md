# Generator for OpenUI5/SAPUI5 projects

[![yeoman generator][yeoman-img]][yeoman-url]
[![Slack OpenUI5 channel][slack-img]][slack-url]  
[![Build Status][test-image]][test-url]
[![License Status][license-image]][license-url]
[![useses node >= 16][node-img]][node-url]
[![useses nvm][nvm-img]][nvm-url]

A project generator for projects that contain one or more UI5 applications ("uimodules") and manage them via [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces). The uimodules itself use the official UI5 tooling. The generator contains multiple [subgenerators](#subgenerators) to help with recurring tasks. It also supports [multiple deployment targets](#deployment) on the SAP Business Technology Platform. This generator was build as a plug-in for the community project [easy-ui5](https://github.com/SAP/generator-easy-ui5/) by [SAP](https://github.com/SAP/).

If you are looking to create a simple UI5 project with no deployment configuration and don't plan to add multiple uimodules, check out the [generator-ui5-app](https://github.com/ui5-community/generator-ui5-app).

> As of version `0.1.0`, we strive to share core functionality (such as webapp scaffolding) with [SAP's `open-ux-tools`](https://github.com/SAP/open-ux-tools) effort, which is "a set of tools and libraries that makes it faster and easier to develop SAP Fiori applications".

## Usage with easy-ui5

```bash
npm i -g yo
yo easy-ui5 project

     _-----_
    |       |    ╭──────────────────────────╮
    |--(o)--|    │  Welcome to the easy-ui5 │
   `---------´   │        generator!        │
    ( _´U`_ )    ╰──────────────────────────╯
    /___A___\   /
     |  ~  |
   __'.___.'__
 ´   `  |° ´ Y `
```

## Subgenerators

This generator is split up into multiple subgenerators to help with recurring tasks even after the initial project generation. See the following list for all available subgenerators:

<details>
<summary>uimodule</summary>

<br>

```bash
yo easy-ui5 project uimodule
```
This subgenerator adds a new uimodule to an existing project. It reuses the config of the existing project and uimodule(s).

</details>

<details>
<summary>fpmpage</summary>

<br>

```bash
yo easy-ui5 project fpmpage
```
This subgenerator adds a new flexible programming model (fpm) page to one of the existing uimodules. This subgenerator only works for projects that enabled the flexible programming model during project creation.

</details>

<details>
<summary>model</summary>

<br>

```bash
yo easy-ui5 project model
```
This subgenerator adds a new data model to one of the existing uimodules. Supported model types are `OData v4`, `OData v2`, and `JSON`. The subgenerator can optionally set-up a proxy to the respective data source via the `ui5.yaml`.

</details>

<details>
<summary>view</summary>

<br>

```bash
yo easy-ui5 project view
```
This subgenerator adds a new XML view to one of the existing uimodules. Only XML views are supported. The subgenerator can optionally set-up the corresponding route and target in the `manifest.json`.

</details>

<details>
<summary>customcontrol</summary>

<br>

```bash
yo easy-ui5 project customcontrol
```
This subgenerator adds a new custom control (which extends an existing UI5 control) to one of the existing uimodules.  

</details>

## Deployment

Projects created with this generator use the [Multitarget Application](https://sap.github.io/cloud-mta-build-tool/) approach can be built and deployed out of the box:

> Make sure you have the [Cloud Foundry CLI installed](https://developers.sap.com/tutorials/cp-cf-download-cli.html) and are logged in to your Cloud Foundry environment via the `cf login` command.

```bash
npm run build
npm run deploy
```

During the prompting phase, the generator will ask on which target platform you want to deploy your project. See the following list for all available deployment targets:

<details>
<summary>Static webserver</summary>

<br>

With this option the project gets deployed to Cloud Foundry via the [Staticfile buildpack](https://docs.cloudfoundry.org/buildpacks/staticfile/) to run on a static webserver without authentication or proxys in place.

</details>

<details>
<summary>Application Router</summary>

<br>

With this option the project gets deployed to Cloud Foundry in the form of an Application Router, which is a Node.js application ([Node.js buildpack](https://docs.cloudfoundry.org/buildpacks/node/index.html)) that acts as a reverse proxy and can handle authentication as well different routes within your project. The uimodules of your project are served via the local `dist/` directory of the Application Router.

</details>

<details>
<summary>SAP HTML5 Application Repository Service</summary>

<br>

With this option the project gets deployed to Cloud Foundry via the SAP HTML5 Application Repository Service. This makes the application visible in the "HTML5 Applications" section in your SAP BTP subaccount and is the foundation for accessing with other apps and services on SAP BTP.

</details>

<details>
<summary>SAP Build Work Zone, standard edition</summary>

<br>

With this option the project gets deployed to Cloud Foundry via the SAP HTML5 Application Repository Service and is also accessible via SAP Build Work Zone, standard edition, which provides a Fiori Launchpad for your applications. 

</details>

<details>
<summary>SAP NetWeaver</summary>

<br>

With this option the uimodules gets deployed to SAP NetWeaver using the [ui5-task-nwabap-deployer](https://www.npmjs.com/package/ui5-task-nwabap-deployer).

> Note: You have to run `npm run build:workspaces` to deploy the uimodules in this case, which is different to the other deployment scenarios.

</details>


## Debugging

Follow these steps to debug this generator (or run it in standalone mode for that matter):

1. Clone this repository.
1. Install the local repository globally via the following command: `npm link`
1. Start one of the [subgenerators](#subgenerators) in a JavaScript Debug Terminal within VS Code: `yo ui5-project:<subgenerator>`

> If you are feeling really fancy, you can also start a subgenerator via the native Node.js debugger and connect an editor of your choice (any Neovim users here? 👋🏻) via the [Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol/): `node --inspect node_modules/yo/lib/cli.js ui5-project:<subgenerator>`

Happy coding!

## Support

Please use the GitHub bug tracking system to post questions, bug reports or to create pull requests.

## Contributing

We welcome any type of contribution (code contributions, pull requests, issues) to this generator equally. Check out the [debugging](#debugging) section to learn how to set this generator up for development on your machine.

[test-image]: https://github.com/ui5-community/generator-ui5-project/actions/workflows/main.yml/badge.svg
[test-url]: https://github.com/ui5-community/generator-ui5-project/actions/workflows/main.yml
[license-image]: https://img.shields.io/github/license/ui5-community/generator-ui5-project.svg
[license-url]: https://github.com/ui5-community/generator-ui5-project/blob/main/LICENSES/Apache-2.0.txt
[slack-img]: https://img.shields.io/badge/openUI5-slack-yellow
[slack-url]: https://openui5.slack.com
[node-img]: https://img.shields.io/badge/node-%3E%3D16-green?style=flat&logo=nodedotjs
[node-url]: https://nodejs.org/docs/latest-v18.x/api/index.html
[nvm-img]: https://img.shields.io/badge/nvm-enabled-9cf?style=flat&logo=gnubash
[nvm-url]: https://github.com/nvm-sh/nvm
[yeoman-img]: https://img.shields.io/badge/easy--ui5-generator-red?style=flat&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAANCAYAAACdKY9CAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAhGVYSWZNTQAqAAAACAAFARIAAwAAAAEAAQAAARoABQAAAAEAAABKARsABQAAAAEAAABSASgAAwAAAAEAAgAAh2kABAAAAAEAAABaAAAAAAAAAEgAAAABAAAASAAAAAEAA6ABAAMAAAABAAEAAKACAAQAAAABAAAADKADAAQAAAABAAAADQAAAADdVr7uAAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgoZXuEHAAAByElEQVQoFU1Sz0tiURS+7/nwKTraqIVCMCCE5CJhFrMQZpgQakCYnYvIvyDXrlyGO9dBGEG7pIWbQR60KogBQaRoFhM6xvgTQ0lByGe+03f8AV34+M497/vOue/cK4hIEe+W0+ncwVaTJOkWKMmynMH+40IizbjX6zlgPO52uxtItFwuF4Hf43RhUBQIvxiGcYDEHqrdg5/8fr/P4/FMsJ9ib7FarXq5XJ57YLgAaDAY/O90OifI/gK4+gRgA8dnwHdASNCq4CvAW6/Xe41G47PFYkFTQ8Y/TBVFMQ2Hw2o6nU5qmvaXTaJYLB6NRqNLmJPAS6VSoWazaVSr1Sm6IkUPwAdIdwUCGQEfcA0Q8Xi8CKJoNPoK5mNRJBK5Bgt0/sptVbfb/QnCdeR8/X7fWSgURD6flzA1UzabFbVa7RnfFOi4wGz9CwaDvzlCx28AL31OxOLZCoVC28v4cDH7P7FY7AYjJNyN0W63KZfL8ZT2Waiq6s+lYQVB2+FwLC9rOVJmvg8CzhGvsmH2NMxm8xbils1mo0AgQKlUihKJBKEq2e12PtYPFvOEeBqKrut3OM4mxpvG/5TC4fAjUB6Pxxmv18tPRgNMb23y4fXMIfWkAAAAAElFTkSuQmCC
[yeoman-url]: https://github.com/yeoman/yeoman
