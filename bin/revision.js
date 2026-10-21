#!/usr/bin/env node
// Thin bin wrapper: survives npm packaging, loads the compiled CLI.
import("../dist/cli.js");
