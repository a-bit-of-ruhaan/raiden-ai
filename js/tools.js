/**
 * RAIDEN AI — EXPLORE TOOLS CONTROLLER
 * Preconfigured specialized workflows for local AI assistance.
 */

const RAIDEN_TOOLS = [
  {
    id: 'code-optimizer',
    title: 'Code Review & Refactor',
    desc: 'Analyze code for performance, readability, and best practices.',
    icon: 'tools',
    template: 'Please review and refactor the following code. Identify any issues and provide an improved version:\n\n```\n# Paste your code here\n```'
  },
  {
    id: 'bug-hunter',
    title: 'Debug & Traceback',
    desc: 'Diagnose errors, trace root causes, and suggest fixes.',
    icon: 'diagnostics',
    template: 'Here is an error I encountered. Please diagnose the root cause and provide a fix:\n\n```\n# Paste error traceback or buggy code\n```'
  },
  {
    id: 'system-blueprint',
    title: 'Architecture Blueprint',
    desc: 'Design modular systems, APIs, and application architecture.',
    icon: 'sparkle',
    template: 'I am building a new application. Please design a high-level architecture including directory layout, component interactions, and data flow:\n\nApplication requirements:\n- '
  },
  {
    id: 'doc-summarizer',
    title: 'Document Summarizer',
    desc: 'Extract key points, dependencies, and decisions from documents.',
    icon: 'file',
    template: 'Please summarize the following document into key highlights, dependencies, and important details:\n\n'
  },
  {
    id: 'sql-architect',
    title: 'SQL & Database Design',
    desc: 'Design schemas, write optimized queries, and plan migrations.',
    icon: 'model',
    template: 'Help me design a database schema and efficient SQL queries for the following scenario:\n\n'
  },
  {
    id: 'regex-engine',
    title: 'Regex Pattern Builder',
    desc: 'Generate regular expressions with explanations and test cases.',
    icon: 'lightning',
    template: 'Create and explain a regular expression pattern to match:\nTarget pattern: '
  },
  {
    id: 'test-generator',
    title: 'Unit Test Generator',
    desc: 'Generate comprehensive test suites with edge cases and mocks.',
    icon: 'tools',
    template: 'Write a comprehensive unit test suite (with edge cases) for the following function:\n\n```\n# Paste your function here\n```'
  },
  {
    id: 'hinglish-explainer',
    title: 'Hinglish Explainer',
    desc: 'Get technical concepts explained in conversational Hinglish.',
    icon: 'chat',
    template: 'Explain the following concept in simple Hinglish with examples: '
  }
];

class ToolsController {
  init() {
    this.renderToolsGrid();
  }

  renderToolsGrid() {
    const grid = document.getElementById('tools-grid');
    if (!grid) return;

    grid.innerHTML = RAIDEN_TOOLS.map(tool => `
      <div class="tool-card" onclick="toolsController.launchTool('${tool.id}')">
        <div class="tool-card-top">
          <div class="tool-icon-box">
            ${ICONS[tool.icon] || ICONS.tools}
          </div>
          <div class="tool-meta">
            <h3 class="tool-name">${tool.title}</h3>
            <p class="tool-desc">${tool.desc}</p>
          </div>
        </div>
        <button class="tool-btn-launch">
          <span>Use template</span>
        </button>
      </div>
    `).join('');
  }

  launchTool(toolId) {
    const tool = RAIDEN_TOOLS.find(t => t.id === toolId);
    if (!tool) return;

    // Create a new session for this tool workflow
    appState.createSession(tool.title);
    window.appController.navigateTo('chat');
    chatController.renderCurrentSession();
    chatController.seedPrompt(tool.template);
    showToast(`Loaded ${tool.title}`, 'success');
  }
}

window.toolsController = new ToolsController();
