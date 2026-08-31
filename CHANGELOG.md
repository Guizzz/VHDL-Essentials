# Changelog

All notable changes to this project will be documented in this file.


## [0.15.10] - 2026-08-31

### Fixed

- **VS Code engine alignment** - aggiornato il requisito minimo a `^1.134.0`, coerente con `@types/vscode` e compatibile con il packaging tramite `vsce`

## [0.15.9] - 2026-08-31

### Added

- **Cancellazione build Quartus** - il pulsante della status bar diventa una croce durante la compilazione e consente di terminare il task in corso (#113)

### Fixed

- **Guard anti-concorrenza** - le build e gli altri task Quartus concorrenti vengono rifiutati mentre un task è attivo, evitando conflitti sui file di progetto (#113)
- **Stato build coerente** - il runner distingue tra completamento, errore e cancellazione e ripristina il pulsante della status bar in tutti i casi (#113)

## [0.15.8] - 2026-08-07

### Fixed

- **Signature help in port map** - ripristinato il signature help per istanziazioni dirette (`entity work.<name>`), anche su più righe, dopo un `generic map` e con più port map nello stesso file
- **Diagnostica simboli di package non importati** - corretta l'emissione del diagnostic `unimported-package-symbol` quando un simbolo esiste in un package `work` ma non è stato importato (ora rispetta anche le `use work.<pkg>.all;` presenti)
- **Log di build Quartus affidabili** - logging con line buffering e path cross-platform (#107)
- **Flash rispetta PROJECT_OUTPUT_DIRECTORY** - il comando flash cerca i candidati `.sof`/`.pof` nella cartella di output configurata e supporta i file `.sof` (#108)
- **Formatter configurabile** - applicate le impostazioni `vhdl.formatter.*` (indentSize, insertSpaces) nel formatter VHDL (#111)

## [0.15.7] - 2026-08-07

### Fixed

- **DO file Tcl paths** — i percorsi nei file `.do` generati ora usano slash normalizzati e vengono racchiusi tra graffe Tcl, evitando errori con spazi e backslash (#102)
- **Falsi positivi lint su keyword/attributi** — eliminati i falsi positivi da TextIO/`math_real`, espressioni con attributi (`'image`) e dichiarazioni `file` (#103)
- **Posizione diagnostica portLint** — i diagnostic sui port non assegnati ora puntano alla posizione reale nel file (#104)
- **QSF Tree View non più bloccato** — il tree view ora gestisce gli errori e non resta più su "Loading" (#105)

## [0.15.6] - 2026-07-27

### Changed

- Sostituito `npm-run-all` (abbandonato) con `npm-run-all2` (fork mantenuta)
- Risolte 6 vulnerabilità Dependabot: `shell-quote`, `js-yaml`, `brace-expansion`, `postcss`

## [0.15.5] - 2026-07-17

### Added

- **Quick-fix per `is` mancante** — `Ctrl+.` su dichiarazioni VHDL che mancano della keyword `is` propone l'inserimento automatico
- **Diagnostica simboli di package non importati** — quando un identificatore esiste in un package `work` ma non è stato importato, viene segnalato con un diagnostic e proposto l'import automatico con `use work.<pkg>.all;`

### Changed

- README riscritto con galleria espansa, quick start e changelog aggiornato
- Aggiornate dipendenze di sviluppo (`typescript-eslint` 8.63.0, `@types/node` 26.1.1)

## [0.15.4] - 2026-07-07

### Added

- **Quartus: New Project** — `Quartus: New Project` command (`quartus-assistant.newProject`) scaffolds a complete Quartus project with guided prompts for device family, part number, entity name, and editable path; generates QPF, QSF, VHDL entity, testbench, and DO file (#86)

## [0.15.3] - 2026-06-30

### Added

- **QSF auto-completamento** — scrivendo `set_global_assignment -name VHDL_FILE ` in un file `.qsf`, la tendina mostra i file `.vhd`/`.vhdl` con navigazione drill-down per cartelle (#80)

## [0.15.2] - 2026-06-26

### Added

- **VHDL Formatter** — `Shift+Alt+F` (Format Document) now indents VHDL files correctly (#45)
  - Line-based state machine indentation for: entity, architecture, process, if/elsif, case/when, for loops, generate, comments
  - Configurable via `vhdl.formatter.indentSize` and `vhdl.formatter.insertSpaces`
  - 18 unit tests covering all constructs

## [0.15.1] - 2026-06-25

### Added

- **Rename Provider** — `F2` (Rename Symbol) now works on VHDL entity names, architecture names, signal names, port names, and variable names. Renaming an entity declaration also renames all its instantiations, and vice-versa (#40)

### Changed

- Bumped dev dependencies (`@types/node`, `typescript-eslint`, `serialize-javascript`, `@vscode/test-cli`)

## [0.15.0] - 2026-06-19

### Added

- **Fit Resource Summary** — after a Quartus build, the QSF Tree View now displays a live **Fit Summary** section parsed from `<project>.fit.summary`. Each resource (logic elements, pins, registers, PLLs, memory bits, etc.) is shown with color-coded usage:
  - 🟢 Green — below 70%
  - 🟡 Orange — 70%–90%
  - 🔴 Red — ≥90%
- Summary entries are sorted by usage descending (most critical first), and the parent node shows `$(pass)`/`$(error)` depending on Fitter status
- Automatic watcher on `*.fit.summary` files — the tree view refreshes as soon as Quartus finishes a build

### Changed

- Landing page and README screenshot gallery — "Build output" replaced with "Fit Resource Summary"

## [0.14.5] - 2026-06-19

### Added

- Signature help for VHDL entity instantiations — when typing inside a `port map(...)`, VS Code now shows the entity's port names and types as you type (#21)
- Quick Fix for undeclared identifiers — `Ctrl+.` on an undeclared identifier offers to declare it as a `signal` in the architecture body

### Changed

- Entity completion now triggers only after typing `work.` prefix instead of on bare entity/component/architecture/end keywords, reducing noise in autocompletion

## [0.14.4] - 2026-06-18

### Added

- Find All References provider for VHDL — right-click any symbol (signal, variable, constant, port, entity, etc.) and pick **Find All References** for cross-file navigation (#21)

### Fixed

- False positive "Undeclared identifier" on `after` keyword
- Syntax linter now correctly detects `begin` on the same line as `process`
- QSF lint not firing — language ID corrected from `qsf` to `quartus`; linter now runs on open editor as well
- Port lint no longer flags commented-out port declarations
- `parseSignals` now skips declarations inside VHDL comments
- Function completion (`rising_edge`/`falling_edge` etc.) now works with partial prefix — changed from `startsWith` to `includes`

### Changed

- Moved build scripts (`esbuild.js`, `.vscode-test.mjs`) to `scripts/` directory
- Moved `opencode.jsonc` to `.opencode/` directory

## [0.14.3] - 2026-06-17

### Added
- Hierarchical VHDL Outline — process symbols now contain local `variable`/`constant` declarations as children
- Function and procedure symbols in packages now show their parameters as children in the Outline
- Entity symbols now use the **Class** (orange diamond) icon instead of `{}` braces
- Entity instantiations (`label : entity work.xxx`) now also use the **Class** icon for consistency
- Outline screenshot in documentation

### Fixed
- False positive "Undeclared identifier" and missing unused-signal warnings for comma-separated declarations (`signal a, b : std_logic;`) — both names are now recognized

## [0.14.2] - 2026-06-17

### Fixed
- False positive "Undeclared identifier" on identifiers after `guarded` keyword (e.g. `q <= guarded d;`)
- False positive "Undeclared identifier" on loop label after `end loop` (e.g. `end loop loop_label;`)

## [0.14.1] - 2026-06-17

### Fixed
- False positive "Undeclared identifier 'alias'" on alias declarations (`alias name is target`)
- False positive "Missing ';'" / "'end' without matching scope" on context declarations (`context name is ... end context name`)
- False positive "Undeclared identifier" on alias target and context name identifiers in `undeclaredIdentifierLint`
- Missing syntax highlighting for `alias` and `context` keywords

### Added
- Syntax highlighting for alias declaration names (pattern `alias <name> is`)


## [0.14.0] - 2026-06-16

### Added
- VitePress documentation site at https://guizzz.github.io/VHDL-Essentials/ with full guide, features, troubleshooting, and configuration pages (#58)
- GitHub Actions deploy workflow for automatic Pages publishing on push to master (#61)
- Custom dark theme (#0f0f23 background, #4fc3f7 cyan accent) with VitePress branding throughout (#62)
- SVG logo with sine/square wave oscilloscope design, 5-pin symmetrical layout, rounded corners
- Screenshot gallery on landing page (2×2 grid with hover glow) showing key features: pin diagnostics, build output, code actions, entity navigation
- Hero image layout: extension screenshot displayed next to title in the VitePress hero section
- Simplified README (~100 lines) with docs badge, link to VitePress site, and cleaned-up feature listing

### Changed
- Extension icon (`resources/icon.png`) resynchronised with the new SVG logo design
- `docs/public/screenshots/build_2.png` optimised (107 KB → 34 KB)

### Removed
- `resources/screen/` directory (duplicate screenshot location — all assets now live under `docs/public/screenshots/`)

### Documentation
- Full VitePress documentation: Getting Started, Features, Troubleshooting, Commands, Configuration, and Changelog pages (#59)
- 15 feature screenshots reorganised under `docs/public/screenshots/` (#60)


## [0.13.2] - 2026-06-12

### Added
- Cross-file package symbol resolution for undeclared identifier lint — symbols exported by a `package` in any open file are resolved via the `EntityIndexer`, eliminating false positives for identifiers consumed via `use work.pkg.all` (#71)
- IEEE and Synopsys function keywords (`to_signed`, `to_unsigned`, `resize`, `conv_integer`, `conv_std_logic_vector`, `shift_left`, `shift_right`, etc.) added to VHDL keywords whitelist — no more spurious undeclared-identifier errors for common numeric_std routines (#72)

### Fixed
- Quartus compile output channel is cleared before each simulation run, so stale messages from previous runs are no longer visible
- Non-error messages from Quartus compile diagnostics (`info`/`warning` severity) are skipped when generating editor diagnostics — they remain visible in the output channel but no longer produce squiggly underlines
- `info` severity added to `QuartusCompileError` type for proper severity categorization

## [0.13.1] - 2026-06-11

### Fixed
- `parseQuartusError` e test cross-platform: rilevamento path assoluti Windows su CI Linux tramite regex `WIN_ABS_RE`, normalizzazione separator backslash/forward-slash, confronti path indipendenti dalla piattaforma nei test

## [0.13.0] - 2026-06-10

### Added
- VHDL Document Symbols (Outline) — `Ctrl+Shift+O` shows file structure: entities with ports/generics, architectures with signals/constants/types/processes/component declarations/entity instantiations/component instantiations, packages with symbols (#20)
- Compilation error navigation — quartus build errors parsed from `msg_tcl_post_message` and raw `Error (NNNN):` format; squiggly underlines on source lines in VHDL files; Ctrl+clickable paths in the output channel (#44)
- Live transcript output — `vsim` stdout piped in real time to a dedicated `'Questa Transcript'` LogOutputChannel (#35)

### Changed
- Build/flash output channel converted to `LogOutputChannel` — native severity-aware coloring via `.info()` / `.warn()` / `.error()` instead of ANSI escape codes (more reliable on Windows)

### Fixed
- `runQuartusTask` now returns a `Promise<number | null>` that resolves only on process `close` event — `await runQuartusTask()` reliably waits for build completion before proceeding
- File path resolution in compile errors: uses `RelativePattern(projectDir, '**/*.vhd')` pre-build scan to build a `basename → full path` map for instant lookups during `parseChunk`

## [0.12.4] - 2026-06-09

### Added
- Undeclared identifier detection — identifiers used but not declared are flagged as errors; recognizes signals, variables, constants, entity ports, generics, types, subtypes, enumeration literals, package names, and for-loop variables (#64)
- Go to Definition for entity-local signals, variables, and constants — `Ctrl+Click` jumps from usage to declaration inside the architecture body (#69)

### Fixed
- Undeclared identifier linter: false positives for time units (`us`, `ms`, etc.), severity levels (`failure`, `note`, `warning`), hex/binary literal prefixes (`x"`, `b"`, `o"`), identifiers inside string literals, and package declaration names
- Unused-signal linter: no longer flags package-scoped declarations (consumed cross-file via `use work.pkg.all`) (#70)

### Documentation
- README updated with undeclared identifier detection, Go to Definition for local signals, and updated Code Actions table

## [0.12.3] - 2026-06-08

### Added
- Code Actions (Quick Fixes) for all lint diagnostics — press `Alt+Enter` on any warning to apply automatic fixes: missing/extra ports in port map, duplicate declarations, unused signals, sensitivity list corrections, QSF duplicates, missing semicolons, wrong `end` keywords, unclosed scopes, `else`/`elsif`/`when` wrapping, package body stubs, and unassigned port stubs (#43)
- Shared `VHDL_KEYWORDS` constant extracted to `src/utils/vhdlKeywords.ts` — both sensitivity and unused-signal linters now import from one place (#67)
- Centralized `offsetToPosition()` utility in `src/utils/positionUtils.ts` — used by duplicate-signal, port-map, and unused-signal linters (#66)
- 400ms debounce on `TodoCommentLinter` to avoid redundant validation on rapid edits (#65)

### Fixed
- `findUnusedSignals`: signal names are now regex-escaped before building the search pattern, preventing crashes if a signal name contained regex-special characters (#68)
- Bare `end` without trailing space (e.g., `end` alone on a line) is now correctly recognized as a scope terminator — no more spurious `Unclosed architecture` diagnostic
- `fixPortmapMissingPort` code action: scans forward from entity line tracking paren depth, appends comma to last mapping, and inserts new mapping with correct indent alignment (no stray `;` at wrong position)

### Documentation
- Added Code Actions feature section with autofix screenshot to README

### Added
- Unused signal/variable/constant lint: warns when a declaration is never used; unused names are grayed out (40% opacity) for visual feedback; declarations inside VHDL comments (`-- signal foo...`) are correctly ignored
- TODO comment markers tracking: scans for `TODO`, `FIXME`, `HACK`, `XXX`, and `NOTE` inside VHDL comments — shown as Info diagnostics in the Problems panel with gold (`#FFD700`) highlighting
- `parseSignals` offset now points to variable/signal name instead of declaration keyword (fixes range placement)

### Fixed
- `findUnusedSignals`: restored original `offsetToLine` + forward-walk column calculation that correctly handles CRLF (`\r\n`) line endings; removed buggy `lineStarts` binary-search approach

### Documentation
- Updated README with unused declarations & TODO markers sections
- All screenshots now use uniform `<img width="600">` for consistent layout

## [0.12.1] - 2026-06-05

### Added
- Port map validation: missing ports and undeclared formals detected in direct entity instantiations (`label : entity work.xxx`) (#39)
- 108 new unit tests across port map parser, port map linter, entity parser, and regression tests

### Fixed
- `offsetToPosition` with CRLF files: replaced `split(/\r?\n/)` with substring + `split('\n')` to avoid 1-char/line accumulation error that placed diagnostics on wrong lines (#39)
- `parseMappings` no longer splits on commas inside VHDL comments
- `findBalancedParen` now skips VHDL comments during parenthesis counting
- Entity declaration offset now points to entity name, not the `entity` keyword
- EntityIndexer O(n²) → O(n) bug in file removal
- Various code quality: translated Italian comments to English, improved error handler, hover ordering, CI step ordering

## [0.12.0] - 2026-06-05

### Added
- VHDL auto-completion: ~80 keywords, local symbols (signals/variables/constants/ports), entities, package names, and package symbols; context-aware (entity/component/architecture context shows only entities) (#57)
- Pin assignment tree items now have a blue `plug` icon and left-click opens `.qsf` at the pin's line (#36)
- Improved entity context detection — works with labels like `spi_master_out : entity work.fa`

## [0.11.0] - 2026-06-05

### Added
- 33 VHDL code snippets: `entity`, `arch`, `pkg`, `pkgb`, `process`, `proc_nr`, `proc_comb`, `fsm`, `inst`, `comp`, `tb`, `clock`, `stim`, `sig`, `sigv`, `var`, `const`, `type`, `subtype`, `case`, `for`, `if`, `func`, `proc`, `func_decl`, `proc_decl`, `forg`, `ifg`, `cnt`, `sr`, `others`, `wait`, `assert` (#37)
- Package body completeness lint — warns when a function/procedure is declared in a package but not implemented in its body
- demo/ project with source VHD files and testbench (for development and testing)
- 58 unit tests across 7 test files for parsers, hover icons, and real-world VHDL (#25)

### Fixed
- Context menu commands now accept serialized `vscode.Uri` from tree view items; auto-matches selected file without QuickPick; robust path extraction with `fsPath`/`resourceUri.fsPath` (#36)
- `isTestBench()` no longer flags entities with own ports + `port map` as testbenches — requires entity with no ports to be considered a testbench
- `variableParser` now skips `component ... end component` blocks to avoid false duplicate port declarations
- `syntaxLint.checkSemicolon` skips `label : name` pattern (component instantiation continuation) to avoid false positive `Missing ;`
- `syntaxLint.tryOpenScope` for `function`/`procedure`: if line ends with `;` and no `is` → declaration only, does not open a scope

## [0.10.3] - 2026-06-04

### Added
- Sensitivity list lint: checks that all read signals are in `process(...)` sensitivity lists for combinatorial processes, and that clock/reset signals used in `rising_edge()`/`falling_edge()` are listed for synchronous processes (#42)
- Skips `process (all)` (VHDL-2008) and processes without sensitivity lists
- Hint for unnecessary signals in sensitivity list displayed directly on the variable name with `DiagnosticTag.Unnecessary`

### Fixed
- `checkSemicolon` now handles comma-separated port declarations like `y, q : out std_logic` — no more false "Missing ';'"
- `port(...)` regex now correctly matches types with parentheses like `std_logic_vector(N-1 downto 0)` (#55)
- Syntax linter no longer produces false "Missing ';'" on generics type keywords (`positive`, `natural`, `integer`, etc.) and multi-line `assert`/`report`/`severity` blocks (#56)

## [0.10.2] - 2026-06-04

### Added
- Package variable hover now shows declared value when available (e.g. `integer := 50000000`) (#54)
- Added validation and error handling for `maxv.quartusPath`: `fs.existsSync()` check, `path.normalize()`, try/catch around `spawn`, and improved error messages (#47)

### Removed
- Removed `quartus-assistant.setQuartusPath` command — replaced by VS Code's built-in settings UI (#50)

### Fixed
- Removed trailing `\\quartus` from `maxv.quartusPath` setting description to avoid confusion

## [0.10.1] - 2026-06-03

### Fixed
- Ctrl+/ now inserts `--` line comment instead of `/**/` block comment in VHDL files (#46)

## [0.10.0] - 2026-06-03

### Added
- Real-time VHDL syntax checking — validates scopes (`if`/`end if`, `process`/`end process`, `for...loop`/`end loop`, etc.), missing semicolons, wrong loop termination (`end while` instead of `end loop`), and stray `end` keywords (#38)
- Diagnostics appear in the Problems panel with 400ms debounce — no configuration needed

### Documentation
- Updated README with syntax checking feature section and screenshot

## [0.9.1] - 2026-06-03

### Fixed
- Output channel now cleared on simulation start — logs from previous build/flash no longer mixed with simulation output (#24)
- Port lint no longer calls `findFiles` + QSF parsing on every keystroke; result is cached and re-parsed only when `.qsf` is saved (#23)

### Refactored
- Consolidated duplicate file watchers in `qsfViewService`: replaced redundant `createFileSystemWatcher` + workspace event listeners with a single watcher using `onDidCreate` / `onDidChange` / `onDidDelete` (#16)
- Split `quartusLogger.ts` into `logger/` folder: output channel management, task lifecycle, and TCL output parsing are now in separate modules
- Extracted tree node classes (`PinAssignmentsNode`, `TestBenchesNode`, `QuestaScriptsNode`) from `qsfTabProvider.ts` into dedicated `treeNodes.ts` (#17)

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
