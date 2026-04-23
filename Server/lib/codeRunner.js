import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { inspect } from 'node:util';
import vm from 'node:vm';

const EXECUTION_TIMEOUT_MS = 5000;
const MAX_CODE_LENGTH = 20000;
const MAX_INPUT_LENGTH = 10000;
const MAX_OUTPUT_LENGTH = 20000;
const OUTPUT_LIMIT_ERROR_CODE = 'OUTPUT_LIMIT_EXCEEDED';
const PROCESS_EXIT_ERROR_CODE = 'PROCESS_EXIT';

const LANGUAGE_RUNNERS = {
  python: {
    command: process.env.PYTHON_BINARY || 'python3',
    extension: '.py',
    getArgs: (filename) => [filename],
  },
};

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function createOutputLimitError() {
  const error = new Error(`Execution stopped after exceeding ${MAX_OUTPUT_LENGTH} characters of output.`);
  error.code = OUTPUT_LIMIT_ERROR_CODE;
  return error;
}

function createProcessExitError(exitCode = 0) {
  const error = new Error('Process exited.');
  error.code = PROCESS_EXIT_ERROR_CODE;
  error.exitCode = Number.isInteger(Number(exitCode)) ? Number(exitCode) : 0;
  return error;
}

export function validateRunPayload(payload = {}) {
  const language = typeof payload.language === 'string' ? payload.language.toLowerCase() : '';
  const code = typeof payload.code === 'string' ? payload.code : '';
  const input = typeof payload.input === 'string' ? payload.input : '';

  if (!['javascript', 'python'].includes(language)) {
    throw createError('Unsupported language. Allowed values are javascript and python.', 400);
  }

  if (!code.trim()) {
    throw createError('Code is required before execution.', 400);
  }

  if (code.length > MAX_CODE_LENGTH) {
    throw createError(`Code exceeds the ${MAX_CODE_LENGTH} character limit.`, 400);
  }

  if (input.length > MAX_INPUT_LENGTH) {
    throw createError(`Input exceeds the ${MAX_INPUT_LENGTH} character limit.`, 400);
  }

  return { language, code, input };
}

function formatProcessOutput({
  stdout,
  stderr,
  exitCode,
  timedOut,
  outputLimitExceeded,
}) {
  const sections = [];

  if (stdout) {
    sections.push('[stdout]');
    sections.push(stdout);
  }

  if (stderr) {
    sections.push('[stderr]');
    sections.push(stderr);
  }

  if (timedOut) {
    sections.push(`Execution timed out after ${EXECUTION_TIMEOUT_MS}ms.`);
  } else if (outputLimitExceeded) {
    sections.push(`Execution stopped after exceeding ${MAX_OUTPUT_LENGTH} characters of output.`);
  } else if (!stdout && !stderr && exitCode === 0) {
    sections.push('Program finished without output.');
  }

  return sections.join('\n\n');
}

function appendOutput(outputState, stream, text) {
  const normalizedText = String(text);
  const totalLength = outputState.stdout.length + outputState.stderr.length;

  if (totalLength >= MAX_OUTPUT_LENGTH) {
    outputState.outputLimitExceeded = true;
    throw createOutputLimitError();
  }

  const remainingLength = MAX_OUTPUT_LENGTH - totalLength;

  if (normalizedText.length > remainingLength) {
    outputState.outputLimitExceeded = true;
    outputState[stream] += normalizedText.slice(0, remainingLength);
    throw createOutputLimitError();
  }

  outputState[stream] += normalizedText;
}

function formatJavaScriptValue(value) {
  return typeof value === 'string'
    ? value
    : inspect(value, { depth: 4, breakLength: Infinity, compact: true });
}

function createJavaScriptSandbox(input, outputState) {
  const normalizedInput = input.replace(/\r\n/g, '\n');
  const inputLines = normalizedInput.length > 0 ? normalizedInput.split('\n') : [];
  let inputIndex = 0;

  const readLine = () => {
    if (inputIndex >= inputLines.length) {
      return null;
    }

    const line = inputLines[inputIndex];
    inputIndex += 1;
    return line;
  };

  const fsShim = {
    readFileSync(source, encoding) {
      if (source !== 0 && source !== '/dev/stdin') {
        throw new Error('The JavaScript runner only supports fs.readFileSync(0, ...).');
      }

      return encoding ? normalizedInput : Buffer.from(normalizedInput);
    },
  };

  const sandbox = {
    Buffer,
    console: {
      log: (...args) => appendOutput(outputState, 'stdout', `${args.map(formatJavaScriptValue).join(' ')}\n`),
      error: (...args) => appendOutput(outputState, 'stderr', `${args.map(formatJavaScriptValue).join(' ')}\n`),
    },
    input: normalizedInput,
    module: { exports: {} },
    exports: {},
    process: {
      argv: ['node', 'main.js'],
      env: {},
      stdin: {
        isTTY: false,
        read: () => normalizedInput,
      },
      stdout: {
        write: (text) => {
          appendOutput(outputState, 'stdout', text);
          return true;
        },
      },
      stderr: {
        write: (text) => {
          appendOutput(outputState, 'stderr', text);
          return true;
        },
      },
      exit: (exitCode) => {
        throw createProcessExitError(exitCode);
      },
    },
    prompt: () => readLine(),
    readLine,
    require: (moduleName) => {
      if (moduleName === 'fs' || moduleName === 'node:fs') {
        return fsShim;
      }

      throw new Error(`Module "${moduleName}" is not available in the JavaScript runner.`);
    },
  };

  sandbox.global = sandbox;
  sandbox.globalThis = sandbox;

  return sandbox;
}

function buildExecutionResult({
  status,
  exitCode,
  signal = null,
  stdout,
  stderr,
  timedOut = false,
  outputLimitExceeded = false,
}) {
  const normalizedStdout = stdout.trimEnd();
  const normalizedStderr = stderr.trimEnd();

  return {
    status,
    exitCode,
    signal,
    stdout: normalizedStdout,
    stderr: normalizedStderr,
    timedOut,
    outputLimitExceeded,
    output: formatProcessOutput({
      stdout: normalizedStdout,
      stderr: normalizedStderr,
      exitCode,
      timedOut,
      outputLimitExceeded,
    }),
  };
}

function runJavaScriptCode({ code, input }) {
  const outputState = {
    stdout: '',
    stderr: '',
    outputLimitExceeded: false,
  };

  const sandbox = createJavaScriptSandbox(input, outputState);

  try {
    vm.runInNewContext(code, sandbox, {
      timeout: EXECUTION_TIMEOUT_MS,
    });

    return buildExecutionResult({
      status: 'success',
      exitCode: 0,
      stdout: outputState.stdout,
      stderr: outputState.stderr,
      outputLimitExceeded: outputState.outputLimitExceeded,
    });
  } catch (error) {
    if (error?.code === PROCESS_EXIT_ERROR_CODE) {
      const exitCode = Number.isInteger(error.exitCode) ? error.exitCode : 0;

      return buildExecutionResult({
        status: exitCode === 0 ? 'success' : 'error',
        exitCode,
        stdout: outputState.stdout,
        stderr: outputState.stderr,
        outputLimitExceeded: outputState.outputLimitExceeded,
      });
    }

    if (error?.code === OUTPUT_LIMIT_ERROR_CODE) {
      return buildExecutionResult({
        status: 'error',
        exitCode: null,
        stdout: outputState.stdout,
        stderr: outputState.stderr,
        outputLimitExceeded: true,
      });
    }

    if (error?.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
      return buildExecutionResult({
        status: 'timeout',
        exitCode: null,
        stdout: outputState.stdout,
        stderr: outputState.stderr,
        timedOut: true,
        outputLimitExceeded: outputState.outputLimitExceeded,
      });
    }

    try {
      appendOutput(
        outputState,
        'stderr',
        `${error?.stack || error?.message || 'Execution failed.'}\n`,
      );
    } catch (appendError) {
      if (appendError?.code !== OUTPUT_LIMIT_ERROR_CODE) {
        throw appendError;
      }
    }

    return buildExecutionResult({
      status: 'error',
      exitCode: 1,
      stdout: outputState.stdout,
      stderr: outputState.stderr,
      outputLimitExceeded: outputState.outputLimitExceeded,
    });
  }
}

function executeSubprocess(command, args, cwd, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let outputLimitExceeded = false;
    let finished = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, EXECUTION_TIMEOUT_MS);

    const finish = (result) => {
      if (finished) {
        return;
      }

      finished = true;
      clearTimeout(timeoutId);
      resolve(result);
    };

    const fail = (error) => {
      if (finished) {
        return;
      }

      finished = true;
      clearTimeout(timeoutId);
      reject(error);
    };

    const appendSubprocessOutput = (stream, chunk) => {
      const text = chunk.toString('utf8');
      const totalLength = stdout.length + stderr.length;

      if (totalLength >= MAX_OUTPUT_LENGTH) {
        outputLimitExceeded = true;
        child.kill('SIGKILL');
        return;
      }

      const remainingLength = MAX_OUTPUT_LENGTH - totalLength;

      if (text.length > remainingLength) {
        outputLimitExceeded = true;

        if (stream === 'stdout') {
          stdout += text.slice(0, remainingLength);
        } else {
          stderr += text.slice(0, remainingLength);
        }

        child.kill('SIGKILL');
        return;
      }

      if (stream === 'stdout') {
        stdout += text;
      } else {
        stderr += text;
      }
    };

    child.stdout.on('data', (chunk) => {
      appendSubprocessOutput('stdout', chunk);
    });

    child.stderr.on('data', (chunk) => {
      appendSubprocessOutput('stderr', chunk);
    });

    child.on('error', (error) => {
      fail(createError(`Unable to start the ${command} runtime: ${error.message}`, 500));
    });

    child.on('close', (exitCode, signal) => {
      const normalizedExitCode = Number.isInteger(exitCode) ? exitCode : null;
      const status = timedOut
        ? 'timeout'
        : outputLimitExceeded || normalizedExitCode !== 0
          ? 'error'
          : 'success';

      finish(
        buildExecutionResult({
          status,
          exitCode: normalizedExitCode,
          signal,
          stdout,
          stderr,
          timedOut,
          outputLimitExceeded,
        }),
      );
    });

    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}

async function runPythonCode({ code, input }) {
  const runner = LANGUAGE_RUNNERS.python;
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'online-proctoring-run-'));
  const filename = path.join(tempDirectory, `main${runner.extension}`);

  try {
    await writeFile(filename, code, 'utf8');
    return await executeSubprocess(runner.command, runner.getArgs(filename), tempDirectory, input);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true }).catch(() => {});
  }
}

export async function runUserCode({ language, code, input }) {
  const startedAt = Date.now();
  const result =
    language === 'javascript'
      ? runJavaScriptCode({ code, input })
      : await runPythonCode({ code, input });

  return {
    ...result,
    language,
    durationMs: Date.now() - startedAt,
  };
}
