# Issues riscontrati

## P0 — Impatto diretto su UX
**Issue 1** — Performance: `findFiles` e parsing QSF a ogni keystroke
- `src/lint/portLint.ts:17` — `onDidChangeTextDocument` chiama `getSettingsFile()` + `parseQsf()` a ogni modifica
- Manca una cache del QSF parsed o un debounce

**Issue 9** — Output channel non pulito all'avvio simulazione
- `src/quartus/quartusRunner.ts:100` — `runSimulation` non chiama `logger.startTask()`, quindi l'output channel trattiene log di build/flash precedenti

## P1 — Rischio funzionale
**Issue 2** — Zero test
- Infrastruttura presente (`@vscode/test-cli`, `out/test/**/*.test.js`) ma nessun file in `src/test/`

**Issue 8** — README carente
- Installation senza link né extension ID
- Manca `maxv.quartusPath` (setting fondamentale)
- Prerequisiti toolchain non documentati
- 5 immagini con path `resources/screen/` probabilmente inesistenti
- `Questasim` → `QuestaSim` in tutto il file
- Nessun command ID VS Code elencato
- Sezione "Why Quartus Assistant?" ridondante (ripete l'intro)
- Nessun troubleshooting per errori comuni

## P2 — Manutenibilità
**Issue 3** — File watcher duplicati
- `src/services/qsfViewService.ts` registra sia `createFileSystemWatcher` che `onDidCreateFiles`/`onDidDeleteFiles`/`onDidSaveTextDocument` per gli stessi pattern
- Il `createFileSystemWatcher` non ha handler `onDidChange`; la save passa da `onDidSaveTextDocument`, quindi il watcher è parzialmente inutile

## P3 — Pulizia estetica
**Issue 7** — File troppo pesanti per singola responsabilità
- `src/quartus/quartusLogger.ts` — 241 righe, fonde formattazione, parsing, output channel management
- `src/providers/qsfTabProvider.ts` — 181 righe, fonde tree data providing, scan, refresh

---

## ✅ Risolti

**Issue 4** — `any` type in qsfTabProvider
- `src/providers/qsfTabProvider.ts:131` — `p: any` → `PinAssignment`

**Issue 5** — `isTestBench()` euristico e fragile
- Aggiunto `port map(...)` come segnale primario di testbench
- `!hasPorts` non basta più da solo: richiede almeno un costrutto di simulazione

**Issue 6** — Inconsistenze naming
- snake_case → camelCase (`tb_file` → `tbFile`)
- Commenti italiani tradotti in inglese (12 file)

---

## 🔮 Future — Intellisense features

**Issue I1** — Completion Provider
- Autocomplete `entity work.<name>` dopo aver scritto `entity work.`
- Autocomplete `use work.<pkg>.all`
- Port name completion dentro `port map(`

**Issue I2** — Signature Help
- Mostrare i port di un entity quando si scrive `port map(` dopo un'istanziazione

**Issue I3** — Document Symbols
- Outline strutturato: entity, architecture, signals, process, function

**Issue I4** — References Provider
- Trova tutti i riferimenti a un segnale/entity/variable nel workspace

**Issue I5** — Code Actions
- "Assign missing pins" dalla warning annotation
- "Generate port map skeleton" da entity name
