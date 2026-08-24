const projects = [
  { name: "Souz", slug: "souz", language: "Kotlin", repowise: true },
  { name: "Souz Go", slug: "souz-go", language: "Go" },
  { name: "Ouroboros", slug: "ouroboros", language: "Python" },
  { name: "Hermes Agent", slug: "hermes", language: "Python" },
  { name: "PicoClaw", slug: "picoclaw", language: "Go" },
];

const artifacts = [
  "health.txt",
  "dead-code.txt",
  "recent-risk.txt",
  "decisions.txt",
  "doctor.txt",
  "init.txt",
  "structurizr.dsl",
  "structurizr.txt",
  "version.txt",
  "target-git-status.txt",
];

const state = {
  selectedSlug: "souz",
  mode: "repowise",
  emerge: new Map(),
  repowise: new Map(),
};

const els = {
  serverLabel: document.querySelector("#server-label"),
  projectCount: document.querySelector("#project-count"),
  projectFilter: document.querySelector("#project-filter"),
  projectList: document.querySelector("#project-list"),
  projectTitle: document.querySelector("#project-title"),
  emergeReportLink: document.querySelector("#emerge-report-link"),
  metricHealth: document.querySelector("#metric-health"),
  metricHealthSub: document.querySelector("#metric-health-sub"),
  metricDeadCode: document.querySelector("#metric-dead-code"),
  metricDeadCodeSub: document.querySelector("#metric-dead-code-sub"),
  metricSloc: document.querySelector("#metric-sloc"),
  metricFiles: document.querySelector("#metric-files"),
  metricGraph: document.querySelector("#metric-graph"),
  metricGraphSub: document.querySelector("#metric-graph-sub"),
  overviewTitle: document.querySelector("#overview-title"),
  analysisVersion: document.querySelector("#analysis-version"),
  scoreAverage: document.querySelector("#score-average"),
  scoreWorst: document.querySelector("#score-worst"),
  scoreRisk: document.querySelector("#score-risk"),
  lowestFiles: document.querySelector("#lowest-files"),
  reportLinks: document.querySelector("#report-links"),
  artifactTitle: document.querySelector("#artifact-title"),
  artifactSelect: document.querySelector("#artifact-select"),
  artifactPreview: document.querySelector("#artifact-preview"),
};

function formatNumber(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "--";
  return Number(value).toLocaleString("en-US");
}

async function fetchText(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function parseRepowise(files) {
  const init = files.get("init.txt") || "";
  const health = files.get("health.txt") || "";
  const deadCode = files.get("dead-code.txt") || "";
  const version = files.get("version.txt") || "";

  const avg = health.match(/Average:\s*([\d.]+)\/10\s*\[([^\]]+)/);
  const worst = health.match(/Worst:\s*([\d.]+)\/10\s*\(([^)]+)/);
  const distribution = health.match(/Distribution.*?([\d.]+)% healthy.*?([\d.]+)% warning.*?([\d.]+)% alert/);
  const perf = health.match(/Performance risk.*?:\s*(\d+) findings.*?avg ([\d.]+)\/10/);
  const dead = init.match(/Dead code\s+(\d+) unreachable\s*·\s*(\d+) unused exports/);
  const graph = init.match(/Graph\s+([\d,]+) nodes\s*·\s*([\d,]+) edges/);
  const indexed = init.match(/Files indexed\s+([\d,]+)/);
  const symbols = init.match(/Symbols\s+([\d,]+)/);
  const decisions = init.match(/Decisions\s+(\d+)/);
  const deadFindings = deadCode.match(/Dead Code \((\d+) findings\)/);
  const versionMatch = version.match(/version\s+([\d.]+)/i);

  return {
    avg: avg ? avg[1] : null,
    healthLabel: avg ? avg[2] : null,
    worstScore: worst ? worst[1] : null,
    worstFile: worst ? worst[2] : null,
    distribution: distribution ? distribution.slice(1, 4) : null,
    perfFindings: perf ? perf[1] : null,
    perfAvg: perf ? perf[2] : null,
    unreachable: dead ? dead[1] : null,
    unusedExports: dead ? dead[2] : null,
    graphNodes: graph ? graph[1] : null,
    graphEdges: graph ? graph[2] : null,
    filesIndexed: indexed ? indexed[1] : null,
    symbols: symbols ? symbols[1] : null,
    decisions: decisions ? decisions[1] : null,
    deadFindings: deadFindings ? deadFindings[1] : null,
    version: versionMatch ? versionMatch[1] : null,
    lowest: parseLowestFiles(health),
  };
}

function parseLowestFiles(healthText) {
  return healthText
    .split("\n")
    .filter((line) => line.startsWith("│ ") && line.includes(".kt") && line.includes("│"))
    .map((line) => line.split("│").map((part) => part.trim()).filter(Boolean))
    .filter((parts) => parts.length >= 6 && /^\d+(\.\d+)?$/.test(parts[1]))
    .slice(0, 6)
    .map((parts) => ({ file: parts[0], score: parts[1], nloc: parts[4], tested: parts[5] }));
}

function renderProjects(filter = "") {
  const needle = filter.trim().toLowerCase();
  const visible = projects.filter((project) => project.name.toLowerCase().includes(needle));

  els.projectCount.textContent = String(projects.length);
  els.projectList.innerHTML = visible
    .map(
      (project) => `
        <button class="project-button ${project.slug === state.selectedSlug ? "is-active" : ""}" type="button" data-project="${project.slug}">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4" y="4" width="16" height="12" rx="1.5"></rect>
            <path d="M8 20h8"></path>
            <path d="M12 16v4"></path>
          </svg>
          <span>
            <strong>${project.name}</strong>
            <span>${project.language}${project.repowise ? " · Repowise" : " · Emerge"}</span>
          </span>
        </button>
      `,
    )
    .join("");
}

function renderArtifactOptions() {
  els.artifactSelect.innerHTML = artifacts.map((name) => `<option value="${name}">${name}</option>`).join("");
  els.artifactSelect.value = "health.txt";
}

function buildReportLinks(project) {
  const links = [
    ["Emerge HTML", `../output/${project.slug}/html/emerge.html`],
    ["Emerge metrics JSON", `../output/${project.slug}/emerge-statistics-and-metrics.json`],
    ["Dependency GraphML", `../output/${project.slug}/emerge-file_result_dependency_graph.graphml`],
  ];

  if (project.repowise) {
    links.unshift(["Repowise Structurizr DSL", "../output/souz/repowise/structurizr.dsl"]);
    links.unshift(["Repowise health snapshot", "../output/souz/repowise/health.txt"]);
  }

  els.reportLinks.innerHTML = links
    .map(
      ([label, href]) => `
        <a class="report-link" href="${href}" target="_blank" rel="noreferrer">
          ${label}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 17 17 7"></path>
            <path d="M8 7h9v9"></path>
          </svg>
        </a>
      `,
    )
    .join("");
}

function renderOverview() {
  const project = projects.find((item) => item.slug === state.selectedSlug) || projects[0];
  const emerge = state.emerge.get(project.slug);
  const repowise = parseRepowise(state.repowise);
  const metrics = emerge?.["overall-metrics"] || {};
  const stats = emerge?.statistics || {};

  els.projectTitle.textContent = project.name;
  els.emergeReportLink.href = `../output/${project.slug}/html/emerge.html`;
  els.metricSloc.textContent = formatNumber(metrics["total-sloc-in-files"]);
  els.metricFiles.textContent = `${formatNumber(stats.scanned_files)} scanned files`;
  els.metricGraph.textContent = formatNumber(metrics["louvain-communities-dependency-graph"]);
  els.metricGraphSub.textContent = "Louvain communities";

  if (project.repowise) {
    els.metricHealth.textContent = repowise.avg ? `${repowise.avg}/10` : "--";
    els.metricHealthSub.textContent = repowise.healthLabel || "Repowise health";
    els.metricDeadCode.textContent = repowise.deadFindings || repowise.unreachable || "--";
    els.metricDeadCodeSub.textContent =
      repowise.unreachable && repowise.unusedExports
        ? `${repowise.unreachable} unreachable · ${repowise.unusedExports} exports`
        : "Repowise findings";
    els.overviewTitle.textContent = state.mode === "repowise" ? "Repowise findings" : "Emerge metrics";
    els.analysisVersion.textContent = repowise.version ? `Repowise ${repowise.version}` : "Repowise";
    els.scoreAverage.textContent = repowise.avg ? `${repowise.avg}/10` : "--";
    els.scoreWorst.textContent = repowise.worstFile ? `${repowise.worstScore}/10` : "--";
    els.scoreWorst.title = repowise.worstFile || "";
    els.scoreRisk.textContent = repowise.perfFindings ? `${repowise.perfFindings} findings` : "--";
    els.lowestFiles.innerHTML = repowise.lowest.length
      ? repowise.lowest
          .map(
            (item) => `
              <li>
                <strong>${item.file}<small class="is-muted"> · ${formatNumber(item.nloc)} NLOC · test ${item.tested}</small></strong>
                <span>${item.score}</span>
              </li>
            `,
          )
          .join("")
      : `<li><strong>No Repowise file ranking loaded.</strong><span>--</span></li>`;
  } else {
    els.metricHealth.textContent = "--";
    els.metricHealthSub.textContent = "Repowise not generated";
    els.metricDeadCode.textContent = "--";
    els.metricDeadCodeSub.textContent = "Repowise not generated";
    els.overviewTitle.textContent = "Emerge metrics";
    els.analysisVersion.textContent = "Emerge";
    els.scoreAverage.textContent = `${formatNumber(metrics["avg-number-of-methods-in-file"])} methods/file`;
    els.scoreWorst.textContent = `${formatNumber(metrics["max-fan-out-dependency-graph"])} fan-out`;
    els.scoreRisk.textContent = `${formatNumber(metrics["avg-fan-in-dependency-graph"])} avg fan-in`;
    els.lowestFiles.innerHTML = `
      <li>
        <strong>Max fan-out: ${metrics["max-fan-out-name-dependency-graph"] || "unknown"}</strong>
        <span>${formatNumber(metrics["max-fan-out-dependency-graph"])}</span>
      </li>
      <li>
        <strong>Max fan-in: ${metrics["max-fan-in-name-dependency-graph"] || "unknown"}</strong>
        <span>${formatNumber(metrics["max-fan-in-dependency-graph"])}</span>
      </li>
    `;
  }

  buildReportLinks(project);
}

async function renderArtifact(name = els.artifactSelect.value) {
  els.artifactTitle.textContent = name;
  try {
    const text = await fetchText(`../output/souz/repowise/${name}`);
    els.artifactPreview.textContent = text;
  } catch (error) {
    els.artifactPreview.textContent = `Unable to load ${name}\n${error.message}`;
  }
}

async function loadData() {
  els.serverLabel.textContent = window.location.host || "localhost";
  renderProjects();
  renderArtifactOptions();

  await Promise.all(
    projects.map(async (project) => {
      try {
        const data = await fetchJson(`../output/${project.slug}/emerge-statistics-and-metrics.json`);
        state.emerge.set(project.slug, data);
      } catch {
        state.emerge.set(project.slug, null);
      }
    }),
  );

  await Promise.all(
    artifacts.map(async (name) => {
      try {
        state.repowise.set(name, await fetchText(`../output/souz/repowise/${name}`));
      } catch {
        state.repowise.set(name, "");
      }
    }),
  );

  renderOverview();
  renderArtifact("health.txt");
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    document.querySelectorAll(".tab-button").forEach((item) => item.classList.toggle("is-active", item === button));
    renderOverview();
  });
});

els.projectFilter.addEventListener("input", (event) => renderProjects(event.target.value));

els.projectList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-project]");
  if (!button) return;
  state.selectedSlug = button.dataset.project;
  renderProjects(els.projectFilter.value);
  renderOverview();
});

els.artifactSelect.addEventListener("change", () => renderArtifact());

loadData().catch((error) => {
  els.artifactPreview.textContent = `Dashboard failed to load.\n${error.stack || error.message}`;
});
