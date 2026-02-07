---
trigger: always_on
glob: "**/*"
description: "Enforce usage of taegong-venv for all terminal operations"
---

# Virtual Environment Policy

You **MUST** execute all terminal commands within the `taegong-venv` virtual environment. 
Do not use the global system Python interpreter.

## Windows Execution
When running commands via `run_command`:
1. **Activate & Run**: Chain the activation script with your target command.
   ```cmd
   taegong-venv\Scripts\activate && <YOUR_COMMAND>
   ```
   Example:
   ```cmd
   taegong-venv\Scripts\activate && python main.py
   ```

2. **Verification**: If unsure, verify the environment first:
   ```cmd
   taegong-venv\Scripts\activate && where python
   ```
