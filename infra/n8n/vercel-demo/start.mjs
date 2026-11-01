import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { runtimeEnvironment } from "./runtime.mjs";

let env;
try {
  env = runtimeEnvironment(process.env);
  await mkdir(env.N8N_USER_FOLDER, { recursive: true, mode: 0o700 });
} catch (error) {
  // runtimeEnvironment emits fixed messages without configuration values.
  console.error(error instanceof Error && error.message.startsWith("Missing hosted settings:")
    ? error.message
    : "Hosted n8n configuration validation failed; check the documented settings.");
  process.exit(1);
}
const child = spawn("n8n", ["start"], { env, stdio: "inherit", shell: false });
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", () => {
  console.error("Hosted n8n could not start.");
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
