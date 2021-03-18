import path from "path";
import { Ioc } from "../fold";
import { Profiler } from "../profiler";

type ApplicationStates =
  | "initiated"
  | "setup"
  | "registered"
  | "booted"
  | "ready"
  | "shutdown";

class Application {
  public state: ApplicationStates = "initiated";
  public preloads: any[] = [];
  public container = new Ioc();
  public profiler: Profiler;

  private registrar: Registrar;
  private providersWithReadyHook: { ready: () => Promise<void> }[] = [];
  private providersWithShutdownHook: { shutdown: () => Promise<void> }[] = [];

  public readonly appName: string;
  public readonly version: string;
  public readonly pkgFile: any;
  public readonly rcFile: any;
  public readonly typescript: boolean;

  public aliasesMap: Map<string, string> = new Map();
  public namespacesMap: Map<string, string> = new Map();
  public directoriesMap: Map<string, string> = new Map();

  constructor(
    public readonly appRoot: string,
    public environment: "web" | "test",
    rcPath: string = "./rcfile.json"
  ) {
    this.rcFile = this.resolveModule(rcPath);
    this.typescript = this.rcFile.typescript;

    this.pkgFile = this.resolveModule("./package.json");
    this.appName = this.pkgFile.name;
    this.version = this.pkgFile.version;
    this.preloads = this.rcFile.preloads;

    this.aliasesMap = new Map(Object.entries(this.rcFile.aliases));
    this.namespacesMap = new Map(Object.entries(this.rcFile.namespaces));
    this.directoriesMap = new Map(Object.entries(this.rcFile.directories));

    this.setEnvVars();
    this.setupGlobals();
    this.registerToTheContainer();
  }

  public async setup(): Promise<void> {
    if (this.state !== "initiated") {
      return;
    }

    this.state = "setup";
    this.registerAliases();
    this.setupLogger();
    this.setupProfiler();
  }

  public async registerProviders(): Promise<void> {
    if (this.state !== "setup") {
      return;
    }

    this.state = "registered";
    await this.profiler.profile("providers:register", {}, async () => {
      const providers = this.rcFile.providers;

      this.registrar = new Registrar([this], this.appRoot);

      const registeredProviders = await this.registrar
        .useProviders(providers, (provider) => {
          const { needsApplication } = provider;
          return new provider(needsApplication ? this : this.container);
        })
        .register();

      registeredProviders.forEach((provider: any) => {
        if (typeof provider.shutdown === "function") {
          this.providersWithShutdownHook.push(provider);
        }

        if (typeof provider.ready === "function") {
          this.providersWithReadyHook.push(provider);
        }
      });
    });
  }

  private setEnvVars() {
    process.env.APP_NAME = this.appName;
    process.env.APP_VERSION = this.version;
  }

  private setupGlobals() {
    global[Symbol.for("ioc.use")] = "use";
    global[Symbol.for("ioc.make")] = "make";
    global[Symbol.for("ioc.call")] = "call";
  }

  private setupLogger() {}

  private setupProfiler() {
    this.profiler = new Profiler(this.appRoot);
    this.container.singleton("Core/Profiler", () => this.profiler);
  }

  private registerToTheContainer() {
    this.container.singleton("Core/Application", () => this);
    this.container.singleton("Core/Helpers", () => {});
  }

  private registerAliases() {
    this.aliasesMap.forEach((toPath, alias) => {
      this.container.alias(path.join(this.appRoot, toPath), alias);
    });
  }

  private resolveModule(modulePath: string) {
    let filePath: string;
    try {
      filePath = path.resolve(this.appRoot, modulePath);
      return require(filePath);
    } catch (error) {
      throw error;
    }
  }
}

export { Application };
