Added 1 new behavioural eval for shell safety, and added 4 new skills regarding behavioural evals

The new eval checks if the agent asks for permission before running shell commands, even if on auto-approve mode.

The new skills are as follows:

eval-runner: 
Allows a contributor to run evals for a specific behavioral area. E.g., "run evals for shell safety", and the skill finds related evals, executes them, and summarizes results using pass percentages. To ensure the agent runs the correct evals for the given prompt, we will scan the evals coverage doc which I cover below. The contributor must have their API key set in their environment before invoking this skill.

eval-generator:
Allows a contributor to describe a behavior they want to test by prompt, and the skill generates a template for a structured eval file in evals/ with placeholders where needed. This will have to be reviewed by the contributor since using an agent to generate evals for its own behaviour might not be progressive. 

failure-summariser:
When an eval fails, the contributor should be able to prompt the name of the failed eval, and the skill should automatically locate the most recent failure logs and json files, analyze, and detail what was expected v/s what was returned. 
