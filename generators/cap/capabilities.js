export default [
    // Databases
    { name: "sqlite", checked: false },
    { name: "hana", checked: false },
    { name: "postgres", checked: true },
    // Runtime
    { name: "approuter", checked: false },
    { name: "html5-repo", checked: true },
    { name: "portal", checked: false },
    // Deployment
    { name: "mta", checked: true },
    { name: "cf-manifest", checked: false },
    { name: "helm", checked: false },
    { name: "helm-unified-runtime", checked: false },
    { name: "containerize", checked: false },
    { name: "pipeline", checked: false },
    // Security
    { name: "xsuaa", checked: true },
    // Lintin
    { name: "lint", checked: true },
    // Typing
    { name: "typer", checked: false },
    { name: "typescript", checked: false },
    // Samples & Sample Data
    { name: "tiny-sample", checked: true },
    { name: "sample", checked: false },
    { name: "data", checked: true },
    // HTTP
    { name: "http", checked: true },
    // Connectivity
    { name: "connectivity", checked: false },
    { name: "destination", checked: false },
    // Logging
    { name: "application-logging", checked: false },
    { name: "audit-logging", checked: false },
    // Messaging
    { name: "local-messaging", checked: false },
    { name: "file-based-messaging", checked: false },
    { name: "enterprise-messaging", checked: false },
    { name: "enterprise-messaging-shared", checked: false },
    { name: "redis-messaging", checked: false },
    { name: "kafka", checked: false },
    // Notifications
    { name: "notifications", checked: false },
    // Attachments
    { name: "attachments", checked: false },
    // Feature Toggles
    { name: "toggles", checked: false },
    // Multitenancy
    { name: "multitenancy", checked: false },
     // Extensibility
     { name: "extensibility" , checked: false }
];