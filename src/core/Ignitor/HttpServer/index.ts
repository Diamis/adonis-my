import { Application } from "../../../application";

class HttpServer {
  private wired: boolean = false;

  public application = new Application(this.appRoot, "web");

  constructor(private appRoot: string) {}

  // подключаем все задачи
  private async wire() {
    if (this.wired) {
      return;
    }

    await this.application.setup(); // Setting up the application.
    await this.application.registerProviders(); // Registering providers
  }

  public async start() {
    try {
      await this.wire();
    } catch (error) {
      console.error(error);
    }
  }
}

export { HttpServer };
