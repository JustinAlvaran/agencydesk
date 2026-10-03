import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

// Manual probe only. Do not schedule this script as a free-host keepalive.
const target = new URL(process.argv[2] ?? "https://invalid.example");
if (target.protocol !== "https:" || !target.hostname.endsWith(".onrender.com") || target.username || target.password) {
  throw new Error("Supply the confirmed HTTPS onrender.com service URL without credentials.");
}
const started = performance.now();
const deadline = started + 180_000;
const attempts = [];
for (let attempt = 1; attempt <= 3 && performance.now() < deadline; attempt++) {
  const remaining = Math.ceil(deadline - performance.now());
  const attemptStart = performance.now();
  try {
    const response = await fetch(new URL("/server/ping", target), {
      signal: AbortSignal.timeout(remaining),
      redirect: "error",
      cache: "no-store",
    });
    const body = await response.text();
    const passed = response.ok && body.trim() === "pong";
    attempts.push({ attempt, status: response.status, passed, elapsedMs: Math.round(performance.now() - attemptStart) });
    if (passed) break;
  } catch {
    // Do not print exception objects: they can include headers or connection details.
    attempts.push({ attempt, passed: false, elapsedMs: Math.round(performance.now() - attemptStart), error: "unavailable_or_timeout" });
  }
}
const report = {
  checkedAt: new Date().toISOString(),
  host: target.hostname,
  passed: attempts.some((entry) => entry.passed),
  elapsedMs: Math.round(performance.now() - started),
  attempts,
  limitation: "Ping verifies startup reachability only; the complete hosting gate also requires licensing, permissions, persistence, publishing, two idle wakeups, and resource logs.",
};
await mkdir(".local", { recursive: true });
await writeFile(".local/cms-health.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
