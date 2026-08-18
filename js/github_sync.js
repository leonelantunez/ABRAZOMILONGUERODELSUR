/**
 * Servicio de sincronización automática entre el Panel de Control y GitHub API
 * Repositorio: leonelantunez/ABRAZOMILONGUERODELSUR
 */

async function guardarEnGitHub() {
  const statusElement = document.getElementById("github-status");

  if (statusElement) {
    statusElement.style.color = "#0056b3";
    statusElement.innerText = "Sincronizando con GitHub...";
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
