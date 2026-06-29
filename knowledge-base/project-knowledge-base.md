# Flagship MCP Server — Knowledge Base

> **Last Updated:** 2026-06-29
> **Status:** Built ✅ — Needs deploy to Render
> **Repo:** https://github.com/pgentles/flagship-mcp-server

---

## 1. Overview

MCP server providing access to all 5 Flagship Universe paid APIs via Model Context Protocol. Connects to Claude Desktop or any MCP-compatible client. Auto-pays x402 in background.

## 2. Connecting Claude Desktop

Add to `claude_desktop_config.json` (Library/Application Support/Claude/claude_desktop_config.json):

```json
{
  "mcpServers": {
    "flagship": {
      "command": "node",
      "args": ["/home/hermes2/flagship-mcp-server/dist/server.js"],
      "env": {
        "KRONOS_URL": "https://kronos-x402.onrender.com",
        "LAW_URL": "https://flagship-law.onrender.com",
        "COMPLIANCE_URL": "https://flagship-compliance.onrender.com",
        "RESUME_URL": "https://flagship-resume-ats.onrender.com",
        "INFRA_URL": "https://flagship-infra-monitor.onrender.com"
      }
    }
  }
}
```

## 3. Tools (21 total)

### Kronos X402 (4 tools)
- kronos_signals — Trading signals
- kronos_risk — Risk assessment
- kronos_forecast — Price forecast
- kronos_decision — Buy/sell/hold decision

### Flagship Law (4 tools)
- law_analyze — FDCPA/FCRA quick scan
- law_detailed — Full analysis + demand letter
- law_regulations — List statutes
- law_categories — Violation categories

### Flagship Compliance (3 tools)
- compliance_analyze — Regulatory check
- compliance_detailed — Gap analysis + remediation
- compliance_regulations — List frameworks

### Flagship Resume ATS (4 tools)
- resume_analyze — ATS compatibility
- resume_tailor — Tailor to job description
- resume_score — Keyword match score
- resume_keywords — Industry keywords

### Flagship Infra Monitor (4 tools)
- infra_add — Add URL to monitor
- infra_remove — Remove URL
- infra_status — Uptime report
- infra_health_check — One-time check

### Utility (2 tools)
- services_status — Health check all services
- sales_report — Transaction counts

## 4. Architecture

- Uses StdioServerTransport (runs locally, communicates via stdio)
- Auto-pays x402 with FALLBACK_PAYMENT header
- Zod schemas for MCP tool parameter validation
- esbuild for fast bundle (53ms build time)

## 5. MCP + x402 Flow

```
Claude → MCP tool call → flagship-mcp-server → Flagship API (x402 payment) → Response
                  ↑
         Auto-pays with X402-Payment header
```

See x402 MCP docs: https://docs.x402.org/guides/mcp-server-with-x402
