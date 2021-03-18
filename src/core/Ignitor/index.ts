import { HttpServer } from "./HttpServer";

class Ignitor {
  constructor(private appRoot: string) {}

  public httpServer() {
    return new HttpServer(this.appRoot);
  }
}

export { Ignitor };
