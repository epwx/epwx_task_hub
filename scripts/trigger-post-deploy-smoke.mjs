const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const REPO = process.env.POST_DEPLOY_SMOKE_REPO || "epwx/epwx_task_hub";
const EVENT_TYPE = process.env.POST_DEPLOY_SMOKE_EVENT || "post-deploy-smoke";
const FRONTEND_URL = process.env.POST_DEPLOY_SMOKE_FRONTEND_URL || "https://tasks.epowex.com";
const API_BASE_URL = process.env.POST_DEPLOY_SMOKE_API_BASE_URL || "https://api.epowex.com";

async function main() {
  if (!GITHUB_TOKEN) {
    console.error("Missing GITHUB_TOKEN. Set it before running this trigger.");
    process.exit(1);
  }

  const payload = {
    event_type: EVENT_TYPE,
    client_payload: {
      frontend_url: FRONTEND_URL,
      api_base_url: API_BASE_URL,
    },
  };

  const response = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.status !== 204) {
    const body = await response.text();
    console.error(`Failed to trigger smoke workflow. HTTP ${response.status}`);
    if (body) {
      console.error(body);
    }
    process.exit(1);
  }

  console.log("Post-deploy smoke workflow triggered successfully.");
  console.log(`Repo: ${REPO}`);
  console.log(`Event: ${EVENT_TYPE}`);
  console.log(`frontend_url: ${FRONTEND_URL}`);
  console.log(`api_base_url: ${API_BASE_URL}`);
}

main().catch((error) => {
  console.error("Trigger script failed:", error?.message || error);
  process.exit(1);
});
