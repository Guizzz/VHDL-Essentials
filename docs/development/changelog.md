# Changelog

<div class="vp-timeline">

<div class="tl-year">
  <span class="tl-year-label">2026</span>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.15.7" target="_blank">v0.15.7</a>
      <span class="tl-date">2026-08-07</span>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>**DO file Tcl paths** — i percorsi nei file <code>.do</code> generati ora usano slash normalizzati e vengono racchiusi tra graffe Tcl, evitando errori con spazi e backslash <a href="https://github.com/Guizzz/VHDL-Essentials/issues/102" target="_blank">#102</a></li>
        <li>**Falsi positivi lint su keyword/attributi** — eliminati i falsi positivi da TextIO/<code>math_real</code>, espressioni con attributi (<code>'image</code>) e dichiarazioni <code>file</code> <a href="https://github.com/Guizzz/VHDL-Essentials/issues/103" target="_blank">#103</a></li>
        <li>**Posizione diagnostica portLint** — i diagnostic sui port non assegnati ora puntano alla posizione reale nel file <a href="https://github.com/Guizzz/VHDL-Essentials/issues/104" target="_blank">#104</a></li>
        <li>**QSF Tree View non più bloccato** — il tree view ora gestisce gli errori e non resta più su "Loading" <a href="https://github.com/Guizzz/VHDL-Essentials/issues/105" target="_blank">#105</a></li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.15.6" target="_blank">v0.15.6</a>
      <span class="tl-date">2026-07-27</span>
    </div>
    <div class="tl-section tl-changed">
      <div class="tl-heading">Changed</div>
      <ul>
        <li>Sostituito <code>npm-run-all</code> (abbandonato) con <code>npm-run-all2</code> (fork mantenuta)</li>
        <li>Risolte 6 vulnerabilità Dependabot: <code>shell-quote</code>, <code>js-yaml</code>, <code>brace-expansion</code>, <code>postcss</code></li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.15.5" target="_blank">v0.15.5</a>
      <span class="tl-date">2026-07-17</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>**Quick-fix per <code>is</code> mancante** — <code>Ctrl+.</code> su dichiarazioni VHDL che mancano della keyword <code>is</code> propone l'inserimento automatico</li>
        <li>**Diagnostica simboli di package non importati** — quando un identificatore esiste in un package <code>work</code> ma non è stato importato, viene segnalato con un diagnostic e proposto l'import automatico con <code>use work.&lt;pkg&gt;.all;</code></li>
      </ul>
    </div>
    <div class="tl-section tl-changed">
      <div class="tl-heading">Changed</div>
      <ul>
        <li>README riscritto con galleria espansa, quick start e changelog aggiornato</li>
        <li>Aggiornate dipendenze di sviluppo (<code>typescript-eslint</code> 8.63.0, <code>@types/node</code> 26.1.1)</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.15.4" target="_blank">v0.15.4</a>
      <span class="tl-date">2026-07-07</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>**Quartus: New Project** — <code>Quartus: New Project</code> command (<code>quartus-assistant.newProject</code>) scaffolds a complete Quartus project with guided prompts for device family, part number, entity name, and editable path; generates QPF, QSF, VHDL entity, testbench, and DO file <a href="https://github.com/Guizzz/VHDL-Essentials/issues/86" target="_blank">#86</a></li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.15.3" target="_blank">v0.15.3</a>
      <span class="tl-date">2026-06-30</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>**QSF auto-completamento** — scrivendo <code>set_global_assignment -name VHDL_FILE </code> in un file <code>.qsf</code>, la tendina mostra i file <code>.vhd</code>/<code>.vhdl</code> con navigazione drill-down per cartelle <a href="https://github.com/Guizzz/VHDL-Essentials/issues/80" target="_blank">#80</a></li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.15.2" target="_blank">v0.15.2</a>
      <span class="tl-date">2026-06-26</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>**VHDL Formatter** — <code>Shift+Alt+F</code> (Format Document) now indents VHDL files correctly <a href="https://github.com/Guizzz/VHDL-Essentials/issues/45" target="_blank">#45</a></li>
        <li>Line-based state machine indentation for: entity, architecture, process, if/elsif, case/when, for loops, generate, comments</li>
        <li>Configurable via <code>vhdl.formatter.indentSize</code> and <code>vhdl.formatter.insertSpaces</code></li>
        <li>18 unit tests covering all constructs</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.15.1" target="_blank">v0.15.1</a>
      <span class="tl-date">2026-06-25</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>**Rename Provider** — <code>F2</code> (Rename Symbol) now works on VHDL entity names, architecture names, signal names, port names, and variable names. Renaming an entity declaration also renames all its instantiations, and vice-versa <a href="https://github.com/Guizzz/VHDL-Essentials/issues/40" target="_blank">#40</a></li>
      </ul>
    </div>
    <div class="tl-section tl-changed">
      <div class="tl-heading">Changed</div>
      <ul>
        <li>Bumped dev dependencies (<code>@types/node</code>, <code>typescript-eslint</code>, <code>serialize-javascript</code>, <code>@vscode/test-cli</code>)</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.15.0" target="_blank">v0.15.0</a>
      <span class="tl-date">2026-06-19</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>**Fit Resource Summary** — after a Quartus build, the QSF Tree View now displays a live **Fit Summary** section parsed from <code>&lt;project&gt;.fit.summary</code>. Each resource (logic elements, pins, registers, PLLs, memory bits, etc.) is shown with color-coded usage:</li>
        <li>🟢 Green — below 70%</li>
        <li>🟡 Orange — 70%–90%</li>
        <li>🔴 Red — ≥90%</li>
        <li>Summary entries are sorted by usage descending (most critical first), and the parent node shows <code>$(pass)</code>/<code>$(error)</code> depending on Fitter status</li>
        <li>Automatic watcher on <code>*.fit.summary</code> files — the tree view refreshes as soon as Quartus finishes a build</li>
      </ul>
    </div>
    <div class="tl-section tl-changed">
      <div class="tl-heading">Changed</div>
      <ul>
        <li>Landing page and README screenshot gallery — "Build output" replaced with "Fit Resource Summary"</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.14.5" target="_blank">v0.14.5</a>
      <span class="tl-date">2026-06-19</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>Signature help for VHDL entity instantiations — when typing inside a <code>port map(...)</code>, VS Code now shows the entity's port names and types as you type <a href="https://github.com/Guizzz/VHDL-Essentials/issues/21" target="_blank">#21</a></li>
        <li>Quick Fix for undeclared identifiers — <code>Ctrl+.</code> on an undeclared identifier offers to declare it as a <code>signal</code> in the architecture body</li>
      </ul>
    </div>
    <div class="tl-section tl-changed">
      <div class="tl-heading">Changed</div>
      <ul>
        <li>Entity completion now triggers only after typing <code>work.</code> prefix instead of on bare entity/component/architecture/end keywords, reducing noise in autocompletion</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.14.4" target="_blank">v0.14.4</a>
      <span class="tl-date">2026-06-18</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>Find All References provider for VHDL — right-click any symbol (signal, variable, constant, port, entity, etc.) and pick **Find All References** for cross-file navigation <a href="https://github.com/Guizzz/VHDL-Essentials/issues/21" target="_blank">#21</a></li>
      </ul>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>False positive "Undeclared identifier" on <code>after</code> keyword</li>
        <li>Syntax linter now correctly detects <code>begin</code> on the same line as <code>process</code></li>
        <li>QSF lint not firing — language ID corrected from <code>qsf</code> to <code>quartus</code>; linter now runs on open editor as well</li>
        <li>Port lint no longer flags commented-out port declarations</li>
        <li><code>parseSignals</code> now skips declarations inside VHDL comments</li>
        <li>Function completion (<code>rising_edge</code>/<code>falling_edge</code> etc.) now works with partial prefix — changed from <code>startsWith</code> to <code>includes</code></li>
      </ul>
    </div>
    <div class="tl-section tl-changed">
      <div class="tl-heading">Changed</div>
      <ul>
        <li>Moved build scripts (<code>esbuild.js</code>, <code>.vscode-test.mjs</code>) to <code>scripts/</code> directory</li>
        <li>Moved <code>opencode.jsonc</code> to <code>.opencode/</code> directory</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.14.3" target="_blank">v0.14.3</a>
      <span class="tl-date">2026-06-17</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>Hierarchical VHDL Outline — process symbols now contain local <code>variable</code>/<code>constant</code> declarations as children</li>
        <li>Function and procedure symbols in packages now show their parameters as children in the Outline</li>
        <li>Entity symbols now use the **Class** (orange diamond) icon instead of <code>{}</code> braces</li>
        <li>Entity instantiations (<code>label : entity work.xxx</code>) now also use the **Class** icon for consistency</li>
        <li>Outline screenshot in documentation</li>
      </ul>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>False positive "Undeclared identifier" and missing unused-signal warnings for comma-separated declarations (<code>signal a, b : std_logic;</code>) — both names are now recognized</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.14.2" target="_blank">v0.14.2</a>
      <span class="tl-date">2026-06-17</span>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>False positive "Undeclared identifier" on identifiers after <code>guarded</code> keyword (e.g. <code>q &lt;= guarded d;</code>)</li>
        <li>False positive "Undeclared identifier" on loop label after <code>end loop</code> (e.g. <code>end loop loop_label;</code>)</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.14.1" target="_blank">v0.14.1</a>
      <span class="tl-date">2026-06-17</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>Syntax highlighting for alias declaration names (pattern <code>alias &lt;name&gt; is</code>)</li>
      </ul>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>False positive "Undeclared identifier 'alias'" on alias declarations (<code>alias name is target</code>)</li>
        <li>False positive "Missing ';'" / "'end' without matching scope" on context declarations (<code>context name is ... end context name</code>)</li>
        <li>False positive "Undeclared identifier" on alias target and context name identifiers in <code>undeclaredIdentifierLint</code></li>
        <li>Missing syntax highlighting for <code>alias</code> and <code>context</code> keywords</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.14.0" target="_blank">v0.14.0</a>
      <span class="tl-date">2026-06-16</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>VitePress documentation site at https://guizzz.github.io/VHDL-Essentials/ with full guide, features, troubleshooting, and configuration pages <a href="https://github.com/Guizzz/VHDL-Essentials/issues/58" target="_blank">#58</a></li>
        <li>GitHub Actions deploy workflow for automatic Pages publishing on push to master <a href="https://github.com/Guizzz/VHDL-Essentials/issues/61" target="_blank">#61</a></li>
        <li>Custom dark theme (#0f0f23 background, #4fc3f7 cyan accent) with VitePress branding throughout <a href="https://github.com/Guizzz/VHDL-Essentials/issues/62" target="_blank">#62</a></li>
        <li>SVG logo with sine/square wave oscilloscope design, 5-pin symmetrical layout, rounded corners</li>
        <li>Screenshot gallery on landing page (2×2 grid with hover glow) showing key features: pin diagnostics, build output, code actions, entity navigation</li>
        <li>Hero image layout: extension screenshot displayed next to title in the VitePress hero section</li>
        <li>Simplified README (~100 lines) with docs badge, link to VitePress site, and cleaned-up feature listing</li>
      </ul>
    </div>
    <div class="tl-section tl-changed">
      <div class="tl-heading">Changed</div>
      <ul>
        <li>Extension icon (<code>resources/icon.png</code>) resynchronised with the new SVG logo design</li>
        <li><code>docs/public/screenshots/build_2.png</code> optimised (107 KB → 34 KB)</li>
      </ul>
    </div>
    <div class="tl-section tl-removed">
      <div class="tl-heading">Removed</div>
      <ul>
        <li><code>resources/screen/</code> directory (duplicate screenshot location — all assets now live under <code>docs/public/screenshots/</code>)</li>
      </ul>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Documentation</div>
      <ul>
        <li>Full VitePress documentation: Getting Started, Features, Troubleshooting, Commands, Configuration, and Changelog pages <a href="https://github.com/Guizzz/VHDL-Essentials/issues/59" target="_blank">#59</a></li>
        <li>15 feature screenshots reorganised under <code>docs/public/screenshots/</code> <a href="https://github.com/Guizzz/VHDL-Essentials/issues/60" target="_blank">#60</a></li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.13.2" target="_blank">v0.13.2</a>
      <span class="tl-date">2026-06-12</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>Cross-file package symbol resolution for undeclared identifier lint — symbols exported by a <code>package</code> in any open file are resolved via the <code>EntityIndexer</code>, eliminating false positives for identifiers consumed via <code>use work.pkg.all</code> <a href="https://github.com/Guizzz/VHDL-Essentials/issues/71" target="_blank">#71</a></li>
        <li>IEEE and Synopsys function keywords (<code>to_signed</code>, <code>to_unsigned</code>, <code>resize</code>, <code>conv_integer</code>, <code>conv_std_logic_vector</code>, <code>shift_left</code>, <code>shift_right</code>, etc.) added to VHDL keywords whitelist — no more spurious undeclared-identifier errors for common numeric_std routines <a href="https://github.com/Guizzz/VHDL-Essentials/issues/72" target="_blank">#72</a></li>
      </ul>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>Quartus compile output channel is cleared before each simulation run, so stale messages from previous runs are no longer visible</li>
        <li>Non-error messages from Quartus compile diagnostics (<code>info</code>/<code>warning</code> severity) are skipped when generating editor diagnostics — they remain visible in the output channel but no longer produce squiggly underlines</li>
        <li><code>info</code> severity added to <code>QuartusCompileError</code> type for proper severity categorization</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.13.1" target="_blank">v0.13.1</a>
      <span class="tl-date">2026-06-11</span>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li><code>parseQuartusError</code> e test cross-platform: rilevamento path assoluti Windows su CI Linux tramite regex <code>WIN_ABS_RE</code>, normalizzazione separator backslash/forward-slash, confronti path indipendenti dalla piattaforma nei test</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.13.0" target="_blank">v0.13.0</a>
      <span class="tl-date">2026-06-10</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>VHDL Document Symbols (Outline) — <code>Ctrl+Shift+O</code> shows file structure: entities with ports/generics, architectures with signals/constants/types/processes/component declarations/entity instantiations/component instantiations, packages with symbols <a href="https://github.com/Guizzz/VHDL-Essentials/issues/20" target="_blank">#20</a></li>
        <li>Compilation error navigation — quartus build errors parsed from <code>msg_tcl_post_message</code> and raw <code>Error (NNNN):</code> format; squiggly underlines on source lines in VHDL files; Ctrl+clickable paths in the output channel <a href="https://github.com/Guizzz/VHDL-Essentials/issues/44" target="_blank">#44</a></li>
        <li>Live transcript output — <code>vsim</code> stdout piped in real time to a dedicated <code>'Questa Transcript'</code> LogOutputChannel <a href="https://github.com/Guizzz/VHDL-Essentials/issues/35" target="_blank">#35</a></li>
      </ul>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li><code>runQuartusTask</code> now returns a <code>Promise&lt;number | null&gt;</code> that resolves only on process <code>close</code> event — <code>await runQuartusTask()</code> reliably waits for build completion before proceeding</li>
        <li>File path resolution in compile errors: uses <code>RelativePattern(projectDir, '**/*.vhd')</code> pre-build scan to build a <code>basename → full path</code> map for instant lookups during <code>parseChunk</code></li>
      </ul>
    </div>
    <div class="tl-section tl-changed">
      <div class="tl-heading">Changed</div>
      <ul>
        <li>Build/flash output channel converted to <code>LogOutputChannel</code> — native severity-aware coloring via <code>.info()</code> / <code>.warn()</code> / <code>.error()</code> instead of ANSI escape codes (more reliable on Windows)</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.12.4" target="_blank">v0.12.4</a>
      <span class="tl-date">2026-06-09</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>Undeclared identifier detection — identifiers used but not declared are flagged as errors; recognizes signals, variables, constants, entity ports, generics, types, subtypes, enumeration literals, package names, and for-loop variables <a href="https://github.com/Guizzz/VHDL-Essentials/issues/64" target="_blank">#64</a></li>
        <li>Go to Definition for entity-local signals, variables, and constants — <code>Ctrl+Click</code> jumps from usage to declaration inside the architecture body <a href="https://github.com/Guizzz/VHDL-Essentials/issues/69" target="_blank">#69</a></li>
      </ul>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>Undeclared identifier linter: false positives for time units (<code>us</code>, <code>ms</code>, etc.), severity levels (<code>failure</code>, <code>note</code>, <code>warning</code>), hex/binary literal prefixes (<code>x"</code>, <code>b"</code>, <code>o"</code>), identifiers inside string literals, and package declaration names</li>
        <li>Unused-signal linter: no longer flags package-scoped declarations (consumed cross-file via <code>use work.pkg.all</code>) <a href="https://github.com/Guizzz/VHDL-Essentials/issues/70" target="_blank">#70</a></li>
      </ul>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Documentation</div>
      <ul>
        <li>README updated with undeclared identifier detection, Go to Definition for local signals, and updated Code Actions table</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.12.3" target="_blank">v0.12.3</a>
      <span class="tl-date">2026-06-08</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>Code Actions (Quick Fixes) for all lint diagnostics — press <code>Alt+Enter</code> on any warning to apply automatic fixes: missing/extra ports in port map, duplicate declarations, unused signals, sensitivity list corrections, QSF duplicates, missing semicolons, wrong <code>end</code> keywords, unclosed scopes, <code>else</code>/<code>elsif</code>/<code>when</code> wrapping, package body stubs, and unassigned port stubs <a href="https://github.com/Guizzz/VHDL-Essentials/issues/43" target="_blank">#43</a></li>
        <li>Shared <code>VHDL_KEYWORDS</code> constant extracted to <code>src/utils/vhdlKeywords.ts</code> — both sensitivity and unused-signal linters now import from one place <a href="https://github.com/Guizzz/VHDL-Essentials/issues/67" target="_blank">#67</a></li>
        <li>Centralized <code>offsetToPosition()</code> utility in <code>src/utils/positionUtils.ts</code> — used by duplicate-signal, port-map, and unused-signal linters <a href="https://github.com/Guizzz/VHDL-Essentials/issues/66" target="_blank">#66</a></li>
        <li>400ms debounce on <code>TodoCommentLinter</code> to avoid redundant validation on rapid edits <a href="https://github.com/Guizzz/VHDL-Essentials/issues/65" target="_blank">#65</a></li>
        <li>Unused signal/variable/constant lint: warns when a declaration is never used; unused names are grayed out (40% opacity) for visual feedback; declarations inside VHDL comments (<code>-- signal foo...</code>) are correctly ignored</li>
        <li>TODO comment markers tracking: scans for <code>TODO</code>, <code>FIXME</code>, <code>HACK</code>, <code>XXX</code>, and <code>NOTE</code> inside VHDL comments — shown as Info diagnostics in the Problems panel with gold (<code>#FFD700</code>) highlighting</li>
        <li><code>parseSignals</code> offset now points to variable/signal name instead of declaration keyword (fixes range placement)</li>
      </ul>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li><code>findUnusedSignals</code>: signal names are now regex-escaped before building the search pattern, preventing crashes if a signal name contained regex-special characters <a href="https://github.com/Guizzz/VHDL-Essentials/issues/68" target="_blank">#68</a></li>
        <li>Bare <code>end</code> without trailing space (e.g., <code>end</code> alone on a line) is now correctly recognized as a scope terminator — no more spurious <code>Unclosed architecture</code> diagnostic</li>
        <li><code>fixPortmapMissingPort</code> code action: scans forward from entity line tracking paren depth, appends comma to last mapping, and inserts new mapping with correct indent alignment (no stray <code>;</code> at wrong position)</li>
        <li><code>findUnusedSignals</code>: restored original <code>offsetToLine</code> + forward-walk column calculation that correctly handles CRLF (<code>\r\n</code>) line endings; removed buggy <code>lineStarts</code> binary-search approach</li>
      </ul>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Documentation</div>
      <ul>
        <li>Added Code Actions feature section with autofix screenshot to README</li>
        <li>Updated README with unused declarations &amp; TODO markers sections</li>
        <li>All screenshots now use uniform <code>&lt;img width="600"&gt;</code> for consistent layout</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.12.1" target="_blank">v0.12.1</a>
      <span class="tl-date">2026-06-05</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>Port map validation: missing ports and undeclared formals detected in direct entity instantiations (<code>label : entity work.xxx</code>) <a href="https://github.com/Guizzz/VHDL-Essentials/issues/39" target="_blank">#39</a></li>
        <li>108 new unit tests across port map parser, port map linter, entity parser, and regression tests</li>
      </ul>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li><code>offsetToPosition</code> with CRLF files: replaced <code>split(/\r?\n/)</code> with substring + <code>split('\n')</code> to avoid 1-char/line accumulation error that placed diagnostics on wrong lines <a href="https://github.com/Guizzz/VHDL-Essentials/issues/39" target="_blank">#39</a></li>
        <li><code>parseMappings</code> no longer splits on commas inside VHDL comments</li>
        <li><code>findBalancedParen</code> now skips VHDL comments during parenthesis counting</li>
        <li>Entity declaration offset now points to entity name, not the <code>entity</code> keyword</li>
        <li>EntityIndexer O(n²) → O(n) bug in file removal</li>
        <li>Various code quality: translated Italian comments to English, improved error handler, hover ordering, CI step ordering</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.12.0" target="_blank">v0.12.0</a>
      <span class="tl-date">2026-06-05</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>VHDL auto-completion: ~80 keywords, local symbols (signals/variables/constants/ports), entities, package names, and package symbols; context-aware (entity/component/architecture context shows only entities) <a href="https://github.com/Guizzz/VHDL-Essentials/issues/57" target="_blank">#57</a></li>
        <li>Pin assignment tree items now have a blue <code>plug</code> icon and left-click opens <code>.qsf</code> at the pin's line <a href="https://github.com/Guizzz/VHDL-Essentials/issues/36" target="_blank">#36</a></li>
        <li>Improved entity context detection — works with labels like <code>spi_master_out : entity work.fa</code></li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.11.0" target="_blank">v0.11.0</a>
      <span class="tl-date">2026-06-05</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>33 VHDL code snippets: <code>entity</code>, <code>arch</code>, <code>pkg</code>, <code>pkgb</code>, <code>process</code>, <code>proc_nr</code>, <code>proc_comb</code>, <code>fsm</code>, <code>inst</code>, <code>comp</code>, <code>tb</code>, <code>clock</code>, <code>stim</code>, <code>sig</code>, <code>sigv</code>, <code>var</code>, <code>const</code>, <code>type</code>, <code>subtype</code>, <code>case</code>, <code>for</code>, <code>if</code>, <code>func</code>, <code>proc</code>, <code>func_decl</code>, <code>proc_decl</code>, <code>forg</code>, <code>ifg</code>, <code>cnt</code>, <code>sr</code>, <code>others</code>, <code>wait</code>, <code>assert</code> <a href="https://github.com/Guizzz/VHDL-Essentials/issues/37" target="_blank">#37</a></li>
        <li>Package body completeness lint — warns when a function/procedure is declared in a package but not implemented in its body</li>
        <li>demo/ project with source VHD files and testbench (for development and testing)</li>
        <li>58 unit tests across 7 test files for parsers, hover icons, and real-world VHDL <a href="https://github.com/Guizzz/VHDL-Essentials/issues/25" target="_blank">#25</a></li>
      </ul>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>Context menu commands now accept serialized <code>vscode.Uri</code> from tree view items; auto-matches selected file without QuickPick; robust path extraction with <code>fsPath</code>/<code>resourceUri.fsPath</code> <a href="https://github.com/Guizzz/VHDL-Essentials/issues/36" target="_blank">#36</a></li>
        <li><code>isTestBench()</code> no longer flags entities with own ports + <code>port map</code> as testbenches — requires entity with no ports to be considered a testbench</li>
        <li><code>variableParser</code> now skips <code>component ... end component</code> blocks to avoid false duplicate port declarations</li>
        <li><code>syntaxLint.checkSemicolon</code> skips <code>label : name</code> pattern (component instantiation continuation) to avoid false positive <code>Missing ;</code></li>
        <li><code>syntaxLint.tryOpenScope</code> for <code>function</code>/<code>procedure</code>: if line ends with <code>;</code> and no <code>is</code> → declaration only, does not open a scope</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.10.3" target="_blank">v0.10.3</a>
      <span class="tl-date">2026-06-04</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>Sensitivity list lint: checks that all read signals are in <code>process(...)</code> sensitivity lists for combinatorial processes, and that clock/reset signals used in <code>rising_edge()</code>/<code>falling_edge()</code> are listed for synchronous processes <a href="https://github.com/Guizzz/VHDL-Essentials/issues/42" target="_blank">#42</a></li>
        <li>Skips <code>process (all)</code> (VHDL-2008) and processes without sensitivity lists</li>
        <li>Hint for unnecessary signals in sensitivity list displayed directly on the variable name with <code>DiagnosticTag.Unnecessary</code></li>
      </ul>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li><code>checkSemicolon</code> now handles comma-separated port declarations like <code>y, q : out std_logic</code> — no more false "Missing ';'"</li>
        <li><code>port(...)</code> regex now correctly matches types with parentheses like <code>std_logic_vector(N-1 downto 0)</code> <a href="https://github.com/Guizzz/VHDL-Essentials/issues/55" target="_blank">#55</a></li>
        <li>Syntax linter no longer produces false "Missing ';'" on generics type keywords (<code>positive</code>, <code>natural</code>, <code>integer</code>, etc.) and multi-line <code>assert</code>/<code>report</code>/<code>severity</code> blocks <a href="https://github.com/Guizzz/VHDL-Essentials/issues/56" target="_blank">#56</a></li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.10.2" target="_blank">v0.10.2</a>
      <span class="tl-date">2026-06-04</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>Package variable hover now shows declared value when available (e.g. <code>integer := 50000000</code>) <a href="https://github.com/Guizzz/VHDL-Essentials/issues/54" target="_blank">#54</a></li>
        <li>Added validation and error handling for <code>maxv.quartusPath</code>: <code>fs.existsSync()</code> check, <code>path.normalize()</code>, try/catch around <code>spawn</code>, and improved error messages <a href="https://github.com/Guizzz/VHDL-Essentials/issues/47" target="_blank">#47</a></li>
      </ul>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>Removed trailing <code>\\quartus</code> from <code>maxv.quartusPath</code> setting description to avoid confusion</li>
      </ul>
    </div>
    <div class="tl-section tl-removed">
      <div class="tl-heading">Removed</div>
      <ul>
        <li>Removed <code>quartus-assistant.setQuartusPath</code> command — replaced by VS Code's built-in settings UI <a href="https://github.com/Guizzz/VHDL-Essentials/issues/50" target="_blank">#50</a></li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.10.1" target="_blank">v0.10.1</a>
      <span class="tl-date">2026-06-03</span>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>Ctrl+/ now inserts <code>--</code> line comment instead of <code>/**/</code> block comment in VHDL files <a href="https://github.com/Guizzz/VHDL-Essentials/issues/46" target="_blank">#46</a></li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.10.0" target="_blank">v0.10.0</a>
      <span class="tl-date">2026-06-03</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>Real-time VHDL syntax checking — validates scopes (<code>if</code>/<code>end if</code>, <code>process</code>/<code>end process</code>, <code>for...loop</code>/<code>end loop</code>, etc.), missing semicolons, wrong loop termination (<code>end while</code> instead of <code>end loop</code>), and stray <code>end</code> keywords <a href="https://github.com/Guizzz/VHDL-Essentials/issues/38" target="_blank">#38</a></li>
        <li>Diagnostics appear in the Problems panel with 400ms debounce — no configuration needed</li>
      </ul>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Documentation</div>
      <ul>
        <li>Updated README with syntax checking feature section and screenshot</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.9.1" target="_blank">v0.9.1</a>
      <span class="tl-date">2026-06-03</span>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>Output channel now cleared on simulation start — logs from previous build/flash no longer mixed with simulation output <a href="https://github.com/Guizzz/VHDL-Essentials/issues/24" target="_blank">#24</a></li>
        <li>Port lint no longer calls <code>findFiles</code> + QSF parsing on every keystroke; result is cached and re-parsed only when <code>.qsf</code> is saved <a href="https://github.com/Guizzz/VHDL-Essentials/issues/23" target="_blank">#23</a></li>
      </ul>
    </div>
    <div class="tl-section tl-changed">
      <div class="tl-heading">Refactored</div>
      <ul>
        <li>Consolidated duplicate file watchers in <code>qsfViewService</code>: replaced redundant <code>createFileSystemWatcher</code> + workspace event listeners with a single watcher using <code>onDidCreate</code> / <code>onDidChange</code> / <code>onDidDelete</code> <a href="https://github.com/Guizzz/VHDL-Essentials/issues/16" target="_blank">#16</a></li>
        <li>Split <code>quartusLogger.ts</code> into <code>logger/</code> folder: output channel management, task lifecycle, and TCL output parsing are now in separate modules</li>
        <li>Extracted tree node classes (<code>PinAssignmentsNode</code>, <code>TestBenchesNode</code>, <code>QuestaScriptsNode</code>) from <code>qsfTabProvider.ts</code> into dedicated <code>treeNodes.ts</code> <a href="https://github.com/Guizzz/VHDL-Essentials/issues/17" target="_blank">#17</a></li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.9.0" target="_blank">v0.9.0</a>
      <span class="tl-date">2026-06-02</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>Added duplicate pin and signal assignment detection for QSF files</li>
        <li>Same <code>PIN_xx</code> assigned to multiple signals → Error diagnostic</li>
        <li>Same signal assigned to multiple pins → Warning diagnostic</li>
      </ul>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>Replaced <code>any</code> type with <code>PinAssignment</code> interface in QSF tab provider</li>
      </ul>
    </div>
    <div class="tl-section tl-changed">
      <div class="tl-heading">Changed</div>
      <ul>
        <li>Renamed <code>buildStatus</code> → <code>taskStatus</code> and <code>startBuild</code> → <code>startTask</code> in runner and status bar</li>
        <li>Enabled strict TypeScript flags and resolved unused variables</li>
        <li>Translated remaining Italian comments to English</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.8.4" target="_blank">v0.8.4</a>
      <span class="tl-date">2026-05-29</span>
    </div>
    <div class="tl-section tl-changed">
      <div class="tl-heading">Changed</div>
      <ul>
        <li>Rebranded extension from Quartus Assistant to VHDL Essentials</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.8.3" target="_blank">v0.8.3</a>
      <span class="tl-date">2026-05-29</span>
    </div>
    <div class="tl-section tl-improved">
      <div class="tl-heading">Improved</div>
      <ul>
        <li>Improved source parsing for local declarations inside architectures and processes.</li>
        <li>Added support for port direction visualization (<code>in</code>, <code>out</code>, <code>inout</code>, <code>buffer</code>) in hover information.</li>
        <li>Enhanced IntelliSense foundations for future navigation and symbol indexing features.</li>
      </ul>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Feature</div>
      <ul>
        <li>Added semantic hover support for VHDL variables, signals, constants and entity ports.</li>
        <li>Hover tooltips now display symbol kind, type information and declaration preview.</li>
        <li>Added contextual hover rendering with syntax-highlighted VHDL code blocks. ![var hover](resources/screen/var_hover.png)</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.8.2" target="_blank">v0.8.2</a>
      <span class="tl-date">2026-05-28</span>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>Fixed VHDL syntax highlighting not working in packaged <code>.vsix</code> builds</li>
        <li>Resolved missing grammar and language configuration files during extension packaging</li>
        <li>Moved <code>syntaxes/</code> outside <code>src/</code> to avoid <code>.vscodeignore</code> exclusion issues</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.8.1" target="_blank">v0.8.1</a>
      <span class="tl-date">2026-05-28</span>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>Fixed VSCode engine compatibility mismatch during extension build.</li>
        <li>Aligned <code>@types/vscode</code> version with the declared <code>engines.vscode</code> requirement.</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.8.0" target="_blank">v0.8.0</a>
      <span class="tl-date">2026-05-28</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Feature</div>
      <ul>
        <li>Added native VHDL syntax highlighting support directly inside Quartus Assistant.</li>
        <li>The extension is now fully independent from external VHDL syntax extensions such as <code>Modern VHDL</code>.</li>
        <li>Added semantic highlighting for: * VHDL keywords and control statements * arithmetic, logical and assignment operators * entities, architectures, packages and components * signals, variables, constants and ports * process labels and instance labels * VHDL built-in functions and attributes * numeric literals and radix formats * time units (<code>fs</code>, <code>ps</code>, <code>ns</code>, <code>us</code>, <code>ms</code>, ...) * boolean literals (<code>true</code>, <code>false</code>) * parentheses and brackets</li>
        <li>Added custom TextMate grammar for VHDL source files.</li>
        <li>Improved readability and editing experience for large VHDL projects.</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.7.0" target="_blank">v0.7.0</a>
      <span class="tl-date">2026-05-27</span>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.6.1" target="_blank">v0.6.1</a>
      <span class="tl-date">2026-05-27</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Feature</div>
      <ul>
        <li>VHDL packages are now automatically discovered and indexed across the workspace.</li>
        <li>Added **Go to Definition** support for VHDL packages.</li>
        <li>You can now <code>Ctrl+Click</code> on package references declared with: ``<code>vhdl use work.&lt;package&gt;.all; </code>`<code> and jump directly to the corresponding package declaration. * Added **Go to Definition** support for symbols declared inside VHDL packages. * You can now navigate to declarations of: * constants * types * subtypes * signals * functions * procedures imported through: </code>`<code>vhdl use work.&lt;package&gt;.all; </code>`` * Added semantic highlighting for: * package references * package symbols imported from workspace packages</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.6.0" target="_blank">v0.6.0</a>
      <span class="tl-date">2026-05-26</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Feature</div>
      <ul>
        <li>Added **Go to Definition** support for VHDL entity instantiations.</li>
        <li>You can now <code>Ctrl+Click</code> on entities instantiated with: ``<code>vhdl entity work.&lt;name&gt; </code>`` and jump directly to the corresponding entity declaration in the workspace.</li>
        <li>Added semantic highlighting for VHDL entities.</li>
        <li>Entity names are highlighted only when a valid declaration exists in the workspace index.</li>
        <li>Introduced automatic indexing of VHDL entities (<code>.vhd</code>, <code>.vhdl</code>).</li>
        <li>The index is updated automatically when: * VHDL files are saved * files are created * files are deleted</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.5.3" target="_blank">v0.5.3</a>
      <span class="tl-date">2026-05-26</span>
    </div>
    <div class="tl-section tl-improved">
      <div class="tl-heading">Improved</div>
      <ul>
        <li>Generate <code>.do</code> files directly by clicking a testbench in the panel view</li>
        <li>Prompt user before overwriting existing <code>.do</code> files</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.5.1" target="_blank">v0.5.1</a>
      <span class="tl-date">2026-05-22</span>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>Minor fix of v0.5.0</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.5.0" target="_blank">v0.5.0</a>
      <span class="tl-date">2026-05-22</span>
    </div>
    <div class="tl-section tl-improved">
      <div class="tl-heading">Improved</div>
      <ul>
        <li>Improved TreeView display using workspace-relative paths instead of absolute paths</li>
        <li>Improved VHDL top-level entity parsing and lookup</li>
        <li>Refactored simulation execution logic for reusable command-based invocation</li>
        <li>Improved cross-platform file path handling using <code>fsPath</code></li>
        <li>Improved extension stability when launching detached QuestaSim GUI processes</li>
      </ul>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Feature</div>
      <ul>
        <li>Added integrated QuestaSim <code>.do</code> launcher</li>
        <li>Added QuickPick selection for simulation scripts</li>
        <li>Added automatic QuestaSim GUI startup from VS Code</li>
        <li>Added support for launching simulations directly from the Quartus Assistant view</li>
        <li>Added automatic workspace-relative <code>.do</code> file discovery</li>
        <li>Added top-level entity source file detection from VHDL entity declarations</li>
        <li>Added project-aware simulation execution using workspace root as working directory</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.4.2" target="_blank">v0.4.2</a>
      <span class="tl-date">2026-05-21</span>
    </div>
    <div class="tl-section tl-improved">
      <div class="tl-heading">Improved</div>
      <ul>
        <li>When generting .do now add only testbench waves</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.4.1" target="_blank">v0.4.1</a>
      <span class="tl-date">2026-05-20</span>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>Fix order of dependencies auto imported on .do file</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.4.0" target="_blank">v0.4.0</a>
      <span class="tl-date">2026-05-20</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Feature</div>
      <ul>
        <li>New command implemented: "Generate QuestaSim .do" file</li>
        <li>Auto search into project if there are testbench files</li>
        <li>Auto search for dependencies of the test bench</li>
        <li>Auto-Generation of .do file ready to be executed on questasim</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.3.2" target="_blank">v0.3.2</a>
      <span class="tl-date">2026-05-19</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Feature</div>
      <ul>
        <li>Implemented new parser for top level entity ports</li>
        <li>Implemented lint warning on top level entity port that are missing on .qsf</li>
        <li>Implemented syntax highlighting for questasim .do files</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.3.1" target="_blank">v0.3.1</a>
      <span class="tl-date">2026-05-18</span>
    </div>
    <div class="tl-section tl-improved">
      <div class="tl-heading">Improved</div>
      <ul>
        <li>Improved logger, now stamp better info of the Error</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.3.0" target="_blank">v0.3.0</a>
      <span class="tl-date">2026-05-15</span>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.2.0" target="_blank">v0.2.0</a>
      <span class="tl-date">2026-05-14</span>
    </div>
    <div class="tl-section tl-fixed">
      <div class="tl-heading">Fixed</div>
      <ul>
        <li>Fixed duplicated output channels on multiple builds</li>
        <li>Fixed output panel not automatically opening during tasks</li>
        <li>Fixed inconsistent status bar updates</li>
        <li>Fixed project visibility refresh after workspace changes</li>
      </ul>
    </div>
    <div class="tl-section tl-improved">
      <div class="tl-heading">Improved</div>
      <ul>
        <li>Refactored extension architecture into modular components</li>
        <li>Improved command separation and maintainability</li>
        <li>Improved Quartus process handling</li>
        <li>Improved status bar management</li>
        <li>Improved logging system reliability</li>
        <li>Improved workspace event handling</li>
        <li>Improved extension scalability for future features</li>
      </ul>
    </div>
  </div>
</div>

<div class="tl-entry">
  <div class="tl-dot tl-dot-first"></div>
  <div class="tl-card">
    <div class="tl-version">
      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v0.1.0" target="_blank">v0.1.0</a>
      <span class="tl-date">2026-05-08</span>
    </div>
    <div class="tl-section tl-added">
      <div class="tl-heading">Added</div>
      <ul>
        <li>Compile Quartus projects directly from VS Code</li>
        <li>Flash CPLDs from inside the editor</li>
        <li>Support for <code>.qpf</code> and <code>.qsf</code> files</li>
        <li>Syntax highlighting for Quartus project files</li>
      </ul>
    </div>
    <div class="tl-note">First public release</div>
  </div>
</div>

</div>
