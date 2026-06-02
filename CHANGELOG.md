# Changelog

All notable changes to this project will be documented in this file.


## [0.9.0] - 2026-06-02

### Added
- Added duplicate pin and signal assignment detection for QSF files
  - Same `PIN_xx` assigned to multiple signals → Error diagnostic
  - Same signal assigned to multiple pins → Warning diagnostic

### Changed
- Renamed `buildStatus` → `taskStatus` and `startBuild` → `startTask` in runner and status bar
- Enabled strict TypeScript flags and resolved unused variables
- Translated remaining Italian comments to English

### Fixed
- Replaced `any` type with `PinAssignment` interface in QSF tab provider

## [0.8.4] - 2026-05-29

### Changed
- Rebranded extension from Quartus Assistant to VHDL Essentials

### Added

* Added hover information for VHDL entities
* Added detailed hover support for entity ports
* Hover now displays:
  * port direction (`in`, `out`, `inout`, `buffer`)
  * signal type (`std_logic`, `unsigned`, etc.)
  * entity/package context
* Added parsing support for entity port declarations
* Added entity port indexing for future IntelliSense features

![entity hover](resources/screen/entity_hover.png)

### Improved

* Improved VHDL symbol parsing engine
* Refactored internal entity indexing structure
* Enhanced navigation data model for upcoming language features
* Improved compatibility with complex `port map` declarations
* advanced semantic highlighting


## [0.8.3] - 2026-05-29

### Feature
- Added semantic hover support for VHDL variables, signals, constants and entity ports.
- Hover tooltips now display symbol kind, type information and declaration preview.
- Added contextual hover rendering with syntax-highlighted VHDL code blocks.

![var hover](resources/screen/var_hover.png)

### Improved
- Improved source parsing for local declarations inside architectures and processes.
- Added support for port direction visualization (`in`, `out`, `inout`, `buffer`) in hover information.
- Enhanced IntelliSense foundations for future navigation and symbol indexing features.

## [0.8.2] - 2026-05-28

### Fixed
- Fixed VHDL syntax highlighting not working in packaged `.vsix` builds
- Resolved missing grammar and language configuration files during extension packaging
- Moved `syntaxes/` outside `src/` to avoid `.vscodeignore` exclusion issues


## [0.8.1] - 2026-05-28

### Fixed
- Fixed VSCode engine compatibility mismatch during extension build.
- Aligned `@types/vscode` version with the declared `engines.vscode` requirement.

## [0.8.0] - 2026-05-28

### Feature

- Added native VHDL syntax highlighting support directly inside Quartus Assistant.
- The extension is now fully independent from external VHDL syntax extensions such as `Modern VHDL`.
- Added semantic highlighting for:
  * VHDL keywords and control statements
  * arithmetic, logical and assignment operators
  * entities, architectures, packages and components
  * signals, variables, constants and ports
  * process labels and instance labels
  * VHDL built-in functions and attributes
  * numeric literals and radix formats
  * time units (`fs`, `ps`, `ns`, `us`, `ms`, ...)
  * boolean literals (`true`, `false`)
  * parentheses and brackets

- Added custom TextMate grammar for VHDL source files.
- Improved readability and editing experience for large VHDL projects.

## [0.7.0] - 2026-05-27

### Feature

* Added **Go to Definition** support for Quartus pin references.
* You can now `Ctrl+Click` on pin usages and jump directly to the associated pin definition.
* Added hover support for pin variables.
* Hovering a pin-related variable now immediately shows the associated Quartus pin information.
* Implemented automatic TreeView reload in the extension panel.
* The panel now refreshes automatically after:

  * creating a new testbench
  * generating a new `.do` file

### Improved

* Improved extension workflow consistency by synchronizing panel updates with generated project files.
* Updated the README with new extension snapshots and visual documentation.


## [0.6.1] - 2026-05-27

### Feature

- VHDL packages are now automatically discovered and indexed across the workspace.
- Added **Go to Definition** support for VHDL packages.
- You can now `Ctrl+Click` on package references declared with:

  ```vhdl
  use work.<package>.all;
  ```

and jump directly to the corresponding package declaration.

* Added **Go to Definition** support for symbols declared inside VHDL packages.
* You can now navigate to declarations of:

  * constants
  * types
  * subtypes
  * signals
  * functions
  * procedures

  imported through:

  ```vhdl
  use work.<package>.all;
  ```

* Added semantic highlighting for:

  * package references
  * package symbols imported from workspace packages

### Improved

* Refactored entity highlighting into a generalized `VhdlHighlightProvider`.
* Improved workspace indexing architecture to support both entities and packages.
* Improved internal symbol resolution for package-scoped declarations.
* Added case-insensitive indexing and lookup behavior for VHDL identifiers.


## [0.6.0] - 2026-05-26

### Feature

- Added **Go to Definition** support for VHDL entity instantiations.
- You can now `Ctrl+Click` on entities instantiated with:
  ```vhdl
  entity work.<name>
  ```

and jump directly to the corresponding entity declaration in the workspace.

- Added semantic highlighting for VHDL entities.
- Entity names are highlighted only when a valid declaration exists in the workspace index.
- Introduced automatic indexing of VHDL entities (`.vhd`, `.vhdl`).
- The index is updated automatically when:
  * VHDL files are saved
  * files are created
  * files are deleted

### Improved

* Refactored language features into modular architecture
* Improved separation between parsing, indexing, and VSCode integration layers.

## [0.5.3] - 2026-05-26

### Improved

- Generate `.do` files directly by clicking a testbench in the panel view
- Prompt user before overwriting existing `.do` files

## [0.5.1] - 2026-05-22

### Fixed
- Minor fix of v0.5.0

## [0.5.0] - 2026-05-22

### Feature

- Added integrated QuestaSim `.do` launcher
- Added QuickPick selection for simulation scripts
- Added automatic QuestaSim GUI startup from VS Code
- Added support for launching simulations directly from the Quartus Assistant view
- Added automatic workspace-relative `.do` file discovery
- Added top-level entity source file detection from VHDL entity declarations
- Added project-aware simulation execution using workspace root as working directory

### Improved

- Improved TreeView display using workspace-relative paths instead of absolute paths
- Improved VHDL top-level entity parsing and lookup
- Refactored simulation execution logic for reusable command-based invocation
- Improved cross-platform file path handling using `fsPath`
- Improved extension stability when launching detached QuestaSim GUI processes

## [0.4.2] - 2026-05-21

### Improved
- When generting .do now add only testbench waves

## [0.4.1] - 2026-05-20
 
### Fixed
- Fix order of dependencies auto imported on .do file

## [0.4.0] - 2026-05-20

### Feature
- New command implemented: "Generate QuestaSim .do" file
- Auto search into project if there are testbench files
- Auto search for dependencies of the test bench
- Auto-Generation of .do file ready to be executed on questasim


## [0.3.2] - 2026-05-19

### Feature

- Implemented new parser for top level entity ports
- Implemented lint warning on top level entity port that are missing on .qsf
- Implemented syntax highlighting for questasim .do files


## [0.3.1] - 2026-05-18

### Improved
- Improved logger, now stamp better info of the Error

## [0.3.0] - 2026-05-15

### Features

- Introduced a new sidebar view for Quartus project inspection
- Implemented `.qsf` parsing support to retrieve:

  - FPGA family
  - Target device
  - Top-level entity
  - Output directory
- Added support for parsing pin assignments
- Added collapsible sections for pin configuration browsing

## [0.2.0] - 2026-05-14

### Improved
- Refactored extension architecture into modular components
- Improved command separation and maintainability
- Improved Quartus process handling
- Improved status bar management
- Improved logging system reliability
- Improved workspace event handling
- Improved extension scalability for future features

### Fixed
- Fixed duplicated output channels on multiple builds
- Fixed output panel not automatically opening during tasks
- Fixed inconsistent status bar updates
- Fixed project visibility refresh after workspace changes

## [0.1.0] - 2026-05-08

### Added
- Compile Quartus projects directly from VS Code
- Flash CPLDs from inside the editor
- Support for `.qpf` and `.qsf` files
- Syntax highlighting for Quartus project files

### Notes
- First public release