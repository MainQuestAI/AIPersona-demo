# AIpersona MCP Server

Exposes 6 consumer research tools via Model Context Protocol (MCP) for external AI agents.

## Tools

| Tool | Description |
|------|-------------|
| `aipersona_study_create` | Create a new consumer research study |
| `aipersona_study_messages` | Get agent conversation messages |
| `aipersona_study_reply` | Reply to agent (confirm plan, approve, or chat) |
| `aipersona_persona_search` | Search available consumer personas |
| `aipersona_persona_chat` | Chat with a persona independently |
| `aipersona_study_report` | Get report/share/replay URLs |

## Setup

```bash
cd apps/mcp
pip install -e .
```

## Run

```bash
# stdio mode (for Claude Code / Cursor)
fastmcp run aipersona_mcp.server:mcp

# Or directly
python -m aipersona_mcp
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `AIPERSONA_API_URL` | `http://127.0.0.1:8000` | Backend API base URL |
| `AIPERSONA_API_KEY` | (empty) | API key for authenticated access |

## Claude Code Integration

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "aipersona": {
      "command": "fastmcp",
      "args": ["run", "aipersona_mcp.server:mcp"],
      "env": {
        "AIPERSONA_API_URL": "http://127.0.0.1:8000"
      }
    }
  }
}
```
