import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export class Island {
  readonly dataDir = mkdtempSync(join(tmpdir(), "walk-"));
  readonly port = 8100 + Math.floor(Math.random() * 800);
  private child: ChildProcess | null = null;

  get url(): string {
    return `http://localhost:${this.port}`;
  }

  get wsBase(): string {
    return `ws://localhost:${this.port}`;
  }

  async start(today?: string): Promise<void> {
    const env: NodeJS.ProcessEnv = { ...process.env, PORT: String(this.port), DATA_DIR: this.dataDir };
    if (today) env.WALK_TODAY = today;
    else delete env.WALK_TODAY;
    this.child = spawn(process.execPath, ["server/index.ts"], { env, stdio: ["ignore", "ignore", "pipe"] });
    this.child.stderr?.on("data", (d) => {
      const s = d.toString();
      if (!/ExperimentalWarning|--trace-warnings/.test(s)) process.stderr.write(s);
    });
    for (let i = 0; i < 100; i++) {
      try {
        await fetch(`${this.url}/health`);
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    throw new Error("island did not start");
  }

  async stop(): Promise<void> {
    const c = this.child;
    if (!c) return;
    this.child = null;
    await new Promise<void>((r) => {
      c.once("exit", () => r());
      c.kill("SIGTERM");
    });
  }

  async restart(today?: string): Promise<void> {
    await this.stop();
    await this.start(today);
  }
}
