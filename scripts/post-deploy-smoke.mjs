const FRONTEND_URL = (process.env.FRONTEND_URL || "https://tasks.epowex.com").replace(/\/$/, "");
const API_BASE_URL = (process.env.API_BASE_URL || "https://api.epowex.com").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.SMOKE_TIMEOUT_MS || "20000", 10);
const SMOKE_MAX_ATTEMPTS = Math.max(1, Number.parseInt(process.env.SMOKE_MAX_ATTEMPTS || "5", 10));
const SMOKE_RETRY_DELAY_MS = Math.max(0, Number.parseInt(process.env.SMOKE_RETRY_DELAY_MS || "3000", 10));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(signal, timeoutMs) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return signal;
  }

  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!signal) {
    return timeoutSignal;
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  timeoutSignal.addEventListener("abort", abort, { once: true });
  return controller.signal;
}

async function runCheck(check) {
  const url = check.url;
  const method = check.method || "GET";
  const headers = { ...(check.headers || {}) };
  const options = {
    method,
    headers,
    signal: withTimeout(undefined, REQUEST_TIMEOUT_MS),
  };

  if (check.body !== undefined) {
    options.body = JSON.stringify(check.body);
    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
  }

  const startedAt = Date.now();
  let response;
  let payload;
  let text;

  try {
    response = await fetch(url, options);
    text = await response.text();
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }
  } catch (error) {
    return {
      ok: false,
      name: check.name,
      url,
      method,
      reason: `Request failed: ${error?.message || String(error)}`,
      durationMs: Date.now() - startedAt,
    };
  }

  const durationMs = Date.now() - startedAt;
  const expectedStatuses = check.expectStatus;
  const statusOk = expectedStatuses.includes(response.status);

  if (!statusOk) {
    return {
      ok: false,
      name: check.name,
      url,
      method,
      reason: `Expected status ${expectedStatuses.join("/")}, got ${response.status}`,
      durationMs,
      status: response.status,
      bodyPreview: text?.slice(0, 240),
    };
  }

  if (typeof check.assert === "function") {
    const assertion = check.assert({ response, payload, text });
    if (assertion !== true) {
      return {
        ok: false,
        name: check.name,
        url,
        method,
        reason: typeof assertion === "string" ? assertion : "Assertion failed",
        durationMs,
        status: response.status,
        bodyPreview: text?.slice(0, 240),
      };
    }
  }

  return {
    ok: true,
    name: check.name,
    url,
    method,
    durationMs,
    status: response.status,
  };
}

function shouldRetry(result) {
  if (result.ok) {
    return false;
  }

  if (typeof result.status !== "number") {
    return true;
  }

  return result.status >= 500 || result.status === 429;
}

async function runCheckWithRetries(check) {
  const maxAttempts = Math.max(1, Number.parseInt(String(check.retryAttempts ?? SMOKE_MAX_ATTEMPTS), 10) || SMOKE_MAX_ATTEMPTS);
  const retryDelayMs = Math.max(0, Number.parseInt(String(check.retryDelayMs ?? SMOKE_RETRY_DELAY_MS), 10) || SMOKE_RETRY_DELAY_MS);
  let lastResult;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await runCheck(check);
    if (result.ok) {
      return {
        ...result,
        attempts: attempt,
      };
    }

    lastResult = {
      ...result,
      attempts: attempt,
    };

    if (attempt >= maxAttempts || !shouldRetry(result)) {
      return lastResult;
    }

    console.log(
      `       Retrying in ${retryDelayMs}ms (attempt ${attempt + 1}/${maxAttempts}) due to: ${result.reason}`
    );
    await sleep(retryDelayMs);
  }

  return lastResult;
}

async function main() {
  console.log(`Running post-deploy smoke checks`);
  console.log(`FRONTEND_URL=${FRONTEND_URL}`);
  console.log(`API_BASE_URL=${API_BASE_URL}`);
  console.log(`SMOKE_MAX_ATTEMPTS=${SMOKE_MAX_ATTEMPTS}`);
  console.log(`SMOKE_RETRY_DELAY_MS=${SMOKE_RETRY_DELAY_MS}`);

  const checks = [
    {
      name: "Frontend home is reachable",
      method: "GET",
      url: `${FRONTEND_URL}/`,
      expectStatus: [200],
      assert: ({ text }) => (text && text.includes("EPWX")) || "Home page did not include expected marker 'EPWX'",
    },
    {
      name: "Telegram mini app route is reachable",
      method: "GET",
      url: `${FRONTEND_URL}/telegram-miniapp`,
      retryAttempts: process.env.SMOKE_TELEGRAM_ROUTE_MAX_ATTEMPTS || "24",
      retryDelayMs: process.env.SMOKE_TELEGRAM_ROUTE_RETRY_DELAY_MS || "5000",
      expectStatus: [200],
      assert: ({ text }) => (text && text.includes("Telegram Daily Claim")) || "Mini app page missing expected heading",
    },
    {
      name: "Daily claims summary API",
      method: "GET",
      url: `${API_BASE_URL}/api/epwx/daily-claims/summary`,
      expectStatus: [200],
      assert: ({ payload }) => {
        if (!payload || typeof payload !== "object") {
          return "Summary API did not return JSON object";
        }
        return typeof payload.todayUtc === "string" || "Summary API missing todayUtc";
      },
    },
    {
      name: "Daily claim input validation",
      method: "POST",
      url: `${API_BASE_URL}/api/epwx/daily-claim`,
      body: { wallet: "0x0000000000000000000000000000000000000001" },
      expectStatus: [400],
    },
    {
      name: "Telegram wallet nonce auth guard",
      method: "POST",
      url: `${API_BASE_URL}/api/telegram-miniapp/wallet/nonce`,
      body: {
        walletAddress: "0x0000000000000000000000000000000000000001",
      },
      expectStatus: [401],
    },
    {
      name: "Telegram group rewards admin guard",
      method: "GET",
      url: `${API_BASE_URL}/api/telegram-miniapp/group-owner/rewards/admin?admin=0x0000000000000000000000000000000000000000&status=pending&limit=1`,
      expectStatus: [403],
    },
  ];

  const results = [];
  for (const check of checks) {
    const result = await runCheckWithRetries(check);
    results.push(result);
    const prefix = result.ok ? "PASS" : "FAIL";
    const statusPart = result.status ? ` status=${result.status}` : "";
    const attemptPart = result.attempts > 1 ? ` attempts=${result.attempts}` : "";
    console.log(`[${prefix}] ${result.name}${statusPart}${attemptPart} (${result.durationMs}ms)`);
    if (!result.ok) {
      console.log(`       ${result.reason}`);
      if (result.bodyPreview) {
        console.log(`       body preview: ${result.bodyPreview.replace(/\s+/g, " ").trim()}`);
      }
    }
  }

  const failures = results.filter((result) => !result.ok);
  if (failures.length > 0) {
    console.error(`\n${failures.length} smoke check(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${results.length} smoke checks passed.`);
}

main().catch((error) => {
  console.error("Smoke runner crashed:", error);
  process.exit(1);
});
