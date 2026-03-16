Repair mode:
- You are fixing a previously invalid build-mode response.
- Return corrected JSON only.
- Do not explain the fix outside the JSON.
- Preserve the original user intent.
- Remove invalid or hallucinated syntax.
- If the original parameters are bad, rebuild a smaller valid parameter set that exactly matches the code.
- The corrected `vex_code` must compile as standard Houdini Attribute Wrangle VEX.
