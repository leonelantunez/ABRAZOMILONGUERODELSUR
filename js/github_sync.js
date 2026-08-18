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
    
    // 1. Obtener la información del archivo actual en GitHub para conseguir su SHA
    const getResponse = await fetch(url, {
      headers: {
        "Authorization": `token ${GITHUB_CONFIG.token}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    let sha = "";
    if (getResponse.ok) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    }

    // 2. Generar el contenido actualizado a partir de las variables globales MILONGAS_DATA y CLASES_DATA
    const nuevoContenido = `// Archivo generado automáticamente - Abrazo Milonguero del Sur
const MILONGAS_DATA = ${JSON.stringify(MILONGAS_DATA, null, 2)};

const CLASES_DATA = ${JSON.stringify(CLASES_DATA, null, 2)};
`;

    // 3. Convertir a Base64 respetando la codificación UTF-8 (tildes, 'ñ', etc.)
    const contentBase64 = btoa(unescape(encodeURIComponent(nuevoContenido)));

    // 4. Enviar actualización vía PUT a GitHub
    const putResponse = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `token ${GITHUB_CONFIG.token}`,
        "Content-Type": "application/json",
        "Accept": "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        message: "Actualización automática de datos desde el Panel de Control",
        content: contentBase64,
        sha: sha ? sha : undefined
      })
    });

    if (putResponse.ok) {
      if (statusElement) {
        statusElement.style.color = "#2ea44f";
        statusElement.innerText = "¡Guardado con éxito en GitHub! En 1 o 2 minutos se reflejará en el sitio.";
      }
      alert("¡Datos actualizados y publicados correctamente en GitHub!");
    } else {
      const errorData = await putResponse.json();
      throw new Error(errorData.message || "Error al actualizar en GitHub");
    }

  } catch (error) {
    console.error("Error al guardar en GitHub:", error);
    if (statusElement) {
      statusElement.style.color = "#d73a49";
      statusElement.innerText = "Error: " + error.message;
    }
    alert("Ocurrió un error al intentar guardar en GitHub: " + error.message);
  }
}
