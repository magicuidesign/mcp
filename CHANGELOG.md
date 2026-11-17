# Changelog

## [3.0.0](https://github.com/magicuidesign/mcp/compare/v2.1.1...v3.0.0) (2026-11-17)


### ⚠ BREAKING CHANGES

* the searchRegistryItems tool is removed. listRegistryItems no longer accepts query, defaults kind to component, returns every matching item unless limit is set, and returns only name and description per item. getRegistryItem is unchanged.

### Features

* remove searchRegistryItems and return all components from listRegistryItems ([#26](https://github.com/magicuidesign/mcp/issues/26)) ([94b0d4c](https://github.com/magicuidesign/mcp/commit/94b0d4c5260530ae65cf1e9666cec8cb0d97526b))


### Bug Fixes

* stop stating the component import path as a fact ([#29](https://github.com/magicuidesign/mcp/issues/29)) ([931ce8b](https://github.com/magicuidesign/mcp/commit/931ce8bb86e070e1d8743d29f5054f12faff4b41))


### Performance Improvements

* return compact JSON from tools ([#30](https://github.com/magicuidesign/mcp/issues/30)) ([cdaece0](https://github.com/magicuidesign/mcp/commit/cdaece0fb0ca49cbe61a35ba987497bb73a34a88))

## [2.1.1](https://github.com/magicuidesign/mcp/compare/v2.1.0...v2.1.1) (2026-11-17)


### Bug Fixes

* accept the item name forms the server emits in getRegistryItem ([#27](https://github.com/magicuidesign/mcp/issues/27)) ([cc2adce](https://github.com/magicuidesign/mcp/commit/cc2adcea4ccf8dcbd9c7956fc9acc5b92db210cd))
* report the package version in serverInfo ([#22](https://github.com/magicuidesign/mcp/issues/22)) ([d6e25a8](https://github.com/magicuidesign/mcp/commit/d6e25a8d4d6da34096ce89deeb9607b350d50ab8))
* stop guessing the component import name and separate the notice from source ([#24](https://github.com/magicuidesign/mcp/issues/24)) ([1b6c79e](https://github.com/magicuidesign/mcp/commit/1b6c79efb41a8b749841699ff538d01ffc933705))


### Performance Improvements

* fetch registry items from the .json URL to skip the 308 redirect ([#25](https://github.com/magicuidesign/mcp/issues/25)) ([6196eed](https://github.com/magicuidesign/mcp/commit/6196eed7b6d37befa3f154ccadaf3c6bcb44d62d))

## 2.1.0 (2026-11-02)

### Bug Fixes

* harden registry tools and bump MCP SDK to 1.32.2 ([#15](https://github.com/magicuidesign/mcp/pull/15)) ([7c7a21b](https://github.com/magicuidesign/mcp/commit/7c7a21b605a624ab0767942e8215a712e6d911e2))

### Refactors

* enhance code and types ([#14](https://github.com/magicuidesign/mcp/pull/14)) ([6f71f4b](https://github.com/magicuidesign/mcp/commit/6f71f4b204cee525a33b2bcf713ddf2132287877))

## 2.0.0 (2026-03-09)

### Features

* add generic registry MCP tools alongside category tools ([#10](https://github.com/Yeom-JinHo/magicui-mcp/issues/10)) ([2ade907](https://github.com/Yeom-JinHo/magicui-mcp/commit/2ade907d28f8fd7dca10b0b1b15f3f6faa271d42))

### Refactors

* remove hardcoded category layer from the MCP server ([#11](https://github.com/Yeom-JinHo/magicui-mcp/issues/11)) ([d5713f0](https://github.com/Yeom-JinHo/magicui-mcp/commit/d5713f01009785d0ff72310baff04c8c4cec0b61))
