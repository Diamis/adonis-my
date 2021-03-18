export class Profiler {
  constructor(public appRoot: string) {}

  public profile<T extends any>(action: string, data?: any, cb?: () => T): T {
    const profilerAction = this.getAction(action, data);
    if (typeof cb === "function") {
      try {
        const result = cb();
        profilerAction.end();
        return result;
      } catch (error) {
        profilerAction.end({ error });
        throw error;
      }
    }
  }

  protected getAction(action: string, data?: any): any {}
}
