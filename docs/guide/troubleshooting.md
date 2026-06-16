# Troubleshooting

| Problem | Solution |
|---|---|
| "Duplicate declaration warnings on entity ports" | Components with matching port names inside the same file are now excluded from parsing |
| "Package body warnings on implemented functions" | Check that the function/procedure name and parameters match the package declaration exactly |
| "Syntax false positive on component instantiation" | Lines matching `label : entity work.xxx` are now recognized and not flagged for missing `;` |
| "Quartus command not found" | Set `maxv.quartusPath` to your Quartus installation folder |
| Pin diagnostics not showing | Ensure a `.qsf` file exists in the workspace root |
| Testbench not appearing | Make sure the testbench entity name matches the filename |
| `.do` file generation fails | Verify that the testbench entity is parsed correctly and all dependencies are in the workspace |
| No hover information | Ensure the workspace index is built (save or reopen files) |
| Build output is empty | Check that `quartus_sh` exists in the configured Quartus path |
