# generator for a UI5 custom control

Scaffold a UI5 custom control that is structured in such a way that it can also distributed as a `node` module via `npm`.

![generating a ui5 custom control](./generate-ui5-control.gif)

## use w/ yeoman locally

```bash
$> npm i -g yo
$> yo ./path-to-this-repo/app

     _-----_     ╭──────────────────────────╮
    |       |    │  Welcome to the amazing  │
    |--(o)--|    │   UI5 custom control     │
   `---------´   │        generator!        │
    ( _´U`_ )    ╰──────────────────────────╯
    /___A___\   /
     |  ~  |
   __'.___.'__
 ´   `  |° ´ Y `

? What's the name space your custom control(s) should live in? (my.ui5.cc)
```

## use w/ options supplied

```bash
$> yo ./path-to-this-repo/app --controlNamespace=bla.fasel --buildDir=../some/dir
# will make the control live in namespace 'bla.fasel"
# and put the built control in directory `cwd` + '../some/dir'
```

## aftermath

the generator also provides a full dev- and test-environment for your new and shiny custom control 😱 !

```bash
$> cd path/to/generator/result
$> npm run test:manual
# ...
info normalizer:translators:ui5Framework Using OpenUI5 version: 1.86.3
info server:custommiddleware:livereload Livereload server started!
Server started
URL: http://localhost:8081
```

As obvious from the above, the `manual` test command boots up a barebones UI5 app using your new custom control, inclusing live reload capabilites. So once you edit the control, the app auto-reloads and changes are visible immediately.

```bash
$> npm run test
# ...
 PASS  test/ui5-app/basic.test.js
  my.ui5.cc.Control
    ✓ should find the my.ui5.cc.Control in index.html (36 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        1.103 s
Ran all test suites.
```

## test for the generator

all tests are located in `__tests__`.  
`jest` is used as test framework and runner.

## contributing

- `prettier`
- let'em tests pass
