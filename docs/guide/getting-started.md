# Getting Started

## Installation

Install **VHDL Essentials** from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Guizzz.quartus-assistant).

**Extension ID**: `Guizzz.quartus-assistant`

Or install from the command line:

```
code --install-extension Guizzz.quartus-assistant
```

## Configuration

### `maxv.quartusPath`

Path to your Intel Quartus Prime installation.

| | |
|---|---|
| **Type** | `string` |
| **Default** | `C:\\altera_lite\\25.1std` |
| **Example** | `C:\\intelFPGA\\25.1std` |

Set this in `settings.json`:

```json
{
    "maxv.quartusPath": "C:\\intelFPGA\\25.1std"
}
```

## Prerequisites

- **Intel Quartus Prime** (Lite/Standard/Pro) — required for build and flash commands
- **QuestaSim** or **ModelSim** — required for simulation and `.do` generation
- **VHDL** source files (`.vhd`, `.vhdl`)
- **Quartus Settings File** (`.qsf`) — required for pin diagnostics and project explorer

## First Steps

1. Open a workspace containing VHDL files (`.vhd` or `.vhdl`)
2. The extension activates automatically — no command needed
3. Open a `.vhd` file and try:
   - `Ctrl+Click` on `entity work.xxx` to jump to declarations
   - Hover a top-level signal to see FPGA pin info
   - Open the Outline panel (`Ctrl+Shift+O`) to see the file structure
4. Open the Quartus Assistant panel from the activity bar (chip icon)
5. Run your first build via `Ctrl+Shift+P` → `Quartus: Build`
