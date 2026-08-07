# Configuration

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

### `vhdl.formatter.indentSize`

Spaces per indent level used by the VHDL formatter (`Shift+Alt+F`).

| | |
|---|---|
| **Type** | `number` |
| **Default** | `4` |

### `vhdl.formatter.insertSpaces`

Use spaces instead of tabs for indentation in the VHDL formatter.

| | |
|---|---|
| **Type** | `boolean` |
| **Default** | `true` |

```json
{
    "vhdl.formatter.indentSize": 2,
    "vhdl.formatter.insertSpaces": true
}
```
