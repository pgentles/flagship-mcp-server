import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import axios from "axios";
import { z } from "zod";

// ============================================================
//  Configuration
// ============================================================

const SERVICES = {
  kronos: {
    name: "Kronos X402",
    baseUrl: process.env.KRONOS_URL || "https://kronos-x402.onrender.com",
    description: "Crypto market intelligence — trading signals, risk assessment, price forecasts",
  },
  law: {
    name: "Flagship Law",
    baseUrl: process.env.LAW_URL || "https://flagship-law.onrender.com",
    description: "FDCPA/FCRA violation analysis — debt collection and credit reporting disputes",
  },
  compliance: {
    name: "Flagship Compliance",
    baseUrl: process.env.COMPLIANCE_URL || "https://flagship-compliance.onrender.com",
    description: "Regulatory compliance analysis — GLBA, SOX, PCI-DSS, CCPA, HIPAA",
  },
  resume: {
    name: "Flagship Resume ATS",
    baseUrl: process.env.RESUME_URL || "https://flagship-resume-ats.onrender.com",
    description: "ATS resume optimization — formatting, keyword matching, tailoring",
  },
  infra: {
    name: "Flagship Infra Monitor",
    baseUrl: process.env.INFRA_URL || "https://flagship-infra-monitor.onrender.com",
    description: "Uptime monitoring — URL health checks, SSL expiry, status reports",
  },
};

const PAYMENT_HEADER = "X402-Payment";
const FALLBACK_PAYMENT = "simulated-mcp-payment";

// ============================================================
//  Helper: Call Service with auto-payment
// ============================================================

async function callService(
  serviceUrl: string,
  endpoint: string,
  method: "GET" | "POST",
  body?: any,
  query?: Record<string, string>,
) {
  const url = `${serviceUrl}${endpoint}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  headers[PAYMENT_HEADER] = FALLBACK_PAYMENT;

  const res = await axios({
    method,
    url,
    data: method === "POST" ? body : undefined,
    params: method === "GET" ? { ...body, ...query } : query,
    headers,
    timeout: 30000,
    validateStatus: () => true,
  });

  return res;
}

async function runHealthProbe() {
  const promises = Object.entries(SERVICES).map(async ([key, svc]) => {
    try {
      const res = await axios.get(`${svc.baseUrl}/health`, { timeout: 5000 });
      return { key, name: svc.name, ok: res.status === 200 };
    } catch {
      return { key, name: svc.name, ok: false };
    }
  });
  return Promise.all(promises);
}

// ============================================================
//  MCP Server
// ============================================================

const server = new McpServer({
  name: "flagship-mcp-server",
  version: "1.0.0",
});

// ─── Kronos X402 Tools ─────────────────────────────────────────────

server.tool(
  "kronos_signals",
  "Get crypto trading signals for a symbol (buy/sell/hold indicators, confidence score)",
  { symbol: z.string().describe("Crypto symbol (e.g. BTC, ETH, SOL)") },
  async (args) => {
    const res = await callService(SERVICES.kronos.baseUrl, "/api/signals", "POST", { symbol: args.symbol });
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

server.tool(
  "kronos_risk",
  "Get risk assessment for a crypto symbol (volatility, drawdown, Sharpe ratio)",
  { symbol: z.string().describe("Crypto symbol (e.g. BTC, ETH)") },
  async (args) => {
    const res = await callService(SERVICES.kronos.baseUrl, "/api/risk", "POST", { symbol: args.symbol });
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

server.tool(
  "kronos_forecast",
  "Get price forecast for a crypto symbol",
  {
    symbol: z.string().describe("Crypto symbol"),
    hours: z.number().optional().describe("Forecast horizon in hours (default: 24)"),
  },
  async (args) => {
    const res = await callService(SERVICES.kronos.baseUrl, "/api/forecast", "POST", { symbol: args.symbol, hours: args.hours || 24 });
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

server.tool(
  "kronos_decision",
  "Get full buy/sell/hold trading decision with position sizing",
  {
    symbol: z.string().describe("Crypto symbol"),
    direction: z.string().describe("Intended direction: long or short"),
    amount_usd: z.number().optional().describe("Position size in USD"),
  },
  async (args) => {
    const res = await callService(SERVICES.kronos.baseUrl, "/api/decision", "POST", { symbol: args.symbol, direction: args.direction, amount_usd: args.amount_usd });
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

// ─── Flagship Law Tools ────────────────────────────────────────────

server.tool(
  "law_analyze",
  "Analyze a debt collector or credit bureau complaint for FDCPA/FCRA violations",
  {
    complaint: z.string().describe("Consumer complaint or collection letter text (min 10 characters)"),
  },
  async (args) => {
    const res = await callService(SERVICES.law.baseUrl, "/api/analyze", "POST", { complaint: args.complaint });
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

server.tool(
  "law_detailed",
  "Full legal analysis with specific statute citations, elements, penalties, and demand letter draft",
  {
    complaint: z.string().describe("Full text of the complaint or legal document (min 10 characters)"),
  },
  async (args) => {
    const res = await callService(SERVICES.law.baseUrl, "/api/detailed", "POST", { complaint: args.complaint });
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

server.tool(
  "law_regulations",
  "List all tracked federal regulations and statutes for debt collection disputes",
  {},
  async () => {
    const res = await callService(SERVICES.law.baseUrl, "/api/regulations", "GET");
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

server.tool(
  "law_categories",
  "List all violation categories with statute references",
  {},
  async () => {
    const res = await callService(SERVICES.law.baseUrl, "/api/categories", "GET");
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

// ─── Flagship Compliance Tools ─────────────────────────────────────

server.tool(
  "compliance_analyze",
  "Analyze a document or practice for regulatory compliance (GLBA, SOX, PCI-DSS, CCPA, HIPAA)",
  {
    document: z.string().describe("Document text or policy to analyze"),
    type: z.string().describe("Document type: 'policy', 'contract', 'notice', 'procedure'"),
  },
  async (args) => {
    const res = await callService(SERVICES.compliance.baseUrl, "/api/analyze", "POST", { document: args.document, type: args.type });
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

server.tool(
  "compliance_detailed",
  "Full compliance report with gap analysis, risk ratings, and remediation steps",
  {
    document: z.string().describe("Full document or policy text"),
    type: z.string().describe("Document type: 'policy', 'contract', 'notice'"),
    sections: z.string().optional().describe("Comma-separated list of specific sections to check"),
  },
  async (args) => {
    const res = await callService(SERVICES.compliance.baseUrl, "/api/detailed", "POST", { document: args.document, type: args.type, sections: args.sections?.split(",") });
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

server.tool(
  "compliance_regulations",
  "List all supported regulatory frameworks and their descriptions",
  {},
  async () => {
    const res = await callService(SERVICES.compliance.baseUrl, "/api/regulations", "GET");
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

// ─── Flagship Resume ATS Tools ─────────────────────────────────────

server.tool(
  "resume_analyze",
  "Analyze a resume for ATS compatibility — formatting, keywords, structure",
  { resume: z.string().describe("Resume text") },
  async (args) => {
    const res = await callService(SERVICES.resume.baseUrl, "/api/analyze", "POST", { resume: args.resume });
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

server.tool(
  "resume_tailor",
  "Tailor a resume to a specific job description for best keyword match",
  {
    resume: z.string().describe("Current resume text"),
    job_description: z.string().describe("Target job posting or description"),
  },
  async (args) => {
    const res = await callService(SERVICES.resume.baseUrl, "/api/tailor", "POST", { resume: args.resume, job_description: args.job_description });
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

server.tool(
  "resume_score",
  "Quick keyword match score between a resume and job description",
  {
    resume: z.string().describe("Resume text"),
    job_description: z.string().describe("Job posting text"),
  },
  async (args) => {
    const res = await callService(SERVICES.resume.baseUrl, "/api/score", "POST", { resume: args.resume, job_description: args.job_description });
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

server.tool(
  "resume_keywords",
  "Get industry-specific ATS keywords for job applications",
  {},
  async () => {
    const res = await callService(SERVICES.resume.baseUrl, "/api/keywords", "GET");
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

// ─── Flagship Infra Monitor Tools ──────────────────────────────────

server.tool(
  "infra_add",
  "Add a URL to uptime monitoring (max 10 per agent ID)",
  {
    url: z.string().describe("URL to monitor (https recommended)"),
    agent: z.string().describe("Your agent identifier"),
    keyword: z.string().optional().describe("Optional keyword that must appear on the page"),
  },
  async (args) => {
    const res = await callService(SERVICES.infra.baseUrl, "/api/add", "POST", { url: args.url, agent: args.agent, keyword: args.keyword });
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

server.tool(
  "infra_remove",
  "Remove a URL from monitoring",
  {
    url: z.string().describe("URL to remove"),
    agent: z.string().describe("Agent identifier"),
  },
  async (args) => {
    const res = await callService(SERVICES.infra.baseUrl, "/api/remove", "POST", { url: args.url, agent: args.agent });
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

server.tool(
  "infra_status",
  "Get status and uptime report for a monitored URL",
  {
    url: z.string().describe("Monitored URL"),
    agent: z.string().describe("Agent identifier"),
  },
  async (args) => {
    const res = await callService(SERVICES.infra.baseUrl, `/api/status/${encodeURIComponent(args.url)}`, "GET", undefined, { agent: args.agent });
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

server.tool(
  "infra_health_check",
  "One-time health check for any URL (no monitoring needed)",
  {
    url: z.string().describe("URL to check"),
    keyword: z.string().optional().describe("Optional keyword to verify presence on page"),
    timeout: z.number().optional().describe("Timeout in milliseconds (default: 10000)"),
  },
  async (args) => {
    const res = await callService(SERVICES.infra.baseUrl, "/api/health", "POST", { url: args.url, keyword: args.keyword, timeout: args.timeout });
    return { content: [{ type: "text", text: JSON.stringify(res.data) }] };
  },
);

// ─── Utility Tools ─────────────────────────────────────────────────

server.tool(
  "services_status",
  "Check health status of all Flagship Universe services",
  {},
  async () => {
    const statuses = await runHealthProbe();
    const lines = statuses.map((s) => `${s.ok ? "✅" : "❌"} ${s.name}`);
    return { content: [{ type: "text", text: `Flagship Universe Service Health\n${"─".repeat(35)}\n${lines.join("\n")}` }] };
  },
);

server.tool(
  "sales_report",
  "Get transaction counts across all Flagship services",
  {},
  async () => {
    const results: string[] = [];
    for (const [key, svc] of Object.entries(SERVICES)) {
      try {
        const res = await axios.get(`${svc.baseUrl}/api/sales`, { timeout: 5000 });
        results.push(`${svc.name}: ${res.data.total || 0} transactions`);
      } catch {
        results.push(`${svc.name}: unreachable`);
      }
    }
    return { content: [{ type: "text", text: results.join("\n") }] };
  },
);

// ============================================================
//  Start Server
// ============================================================

// ============================================================
//  HTTP Mode (for public discovery & Claude Desktop remote)
// ============================================================

function createHttpServer() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "flagship-mcp-server live",
      transport: "http",
      services: Object.keys(SERVICES),
      tools: 21,
    });
  });

  app.get("/sse", async (_req, res) => {
    res.json({
      message: "Use POST /mcp for JSON-RPC calls",
      endpoints: { mcp: "/mcp", health: "/health" },
    });
  });

  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  return app;
}

// ============================================================
//  Start Server
// ============================================================

async function main() {
  const mode = process.env.TRANSPORT || "stdio";

  if (mode === "http") {
    const port = parseInt(process.env.MCP_PORT || "8765");
    const app = createHttpServer();
    app.listen(port, "0.0.0.0", () => {
      console.error(`Flagship MCP Server (HTTP) on port ${port}`);
      console.error(`Services: ${Object.keys(SERVICES).join(", ")}`);
      console.error(`Endpoints: /health, /mcp`);
    });
  } else {
    console.error("Flagship MCP Server starting...");
    console.error(`Services configured: ${Object.keys(SERVICES).join(", ")}`);
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
