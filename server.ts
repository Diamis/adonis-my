import "reflect-metadata";
import sourceMapSupport from "source-map-support";
import { Ignitor } from "./src/core/Ignitor";

sourceMapSupport.install({ handleUncaughtExceptions: false });

new Ignitor(__dirname).httpServer().start();
