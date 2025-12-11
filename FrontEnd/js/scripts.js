const STEAM_IDS = [
  "76561198827572702",
  "76561198161382037",
  "76561199191953345"
];

const sellers = ["DarkWolf", "LunaStore", "CelestialTrade", "NovaSeller"];
const prices = ["$20", "$25", "$28", "$30"];
const descriptions = [
  "Cuenta ideal para comenzar, con buenas horas y biblioteca equilibrada.",
  "Incluye juegos competitivos y títulos AAA muy buscados.",
  "Perfecta para usuarios casuales, variedad de géneros.",
  "Cuenta sólida, con buena reputación y biblioteca de calidad."
];

async function obtenerDatos(id) {
  const perfil = await fetch(`http://localhost:3000/steam/${id}/profile`).then(r => r.json());
  const biblioteca = await fetch(`http://localhost:3000/steam/${id}/library`).then(r => r.json());

  // Evitar errores si la API falla
  const juegos = biblioteca?.juegos ?? [];
  const totalHoras = juegos.reduce((t, j) => t + (j.horas || 0), 0);

  return {
    perfil,
    biblioteca,
    totalJuegos: juegos.length,
    totalHoras,
    fechaCreacion: perfil.timecreated
      ? new Date(perfil.timecreated * 1000).toLocaleDateString()
      : "Desconocida"
  };
}

async function cargarDatos() {
  try {
    const cardsContainer = document.getElementById("cards");
    cardsContainer.innerHTML = "";

    // Cargar datos de ambos IDs solo una vez
    const data = await Promise.all(STEAM_IDS.map(id => obtenerDatos(id)));

    for (let i = 0; i < 4; i++) {
      const d = data[i % STEAM_IDS.length]; // alterna perfil1 → perfil2 → perfil1 → perfil2

      const card = document.createElement("div");
      card.className = "steam-card";

      card.innerHTML = `
        <div class="steam-left">
          <img src="${d.perfil.avatarfull}" class="steam-avatar">
        </div>

        <div class="steam-center">

          <div class="steam-row top-info">
            <span class="label">Nombre de la cuenta:</span>
            <span class="value">${d.perfil.personaname}</span>

            <span class="label">Creación:</span>
            <span class="value">${d.fechaCreacion}</span>
          </div>

          <div class="steam-row stats">
            <span>Total de juegos: ${d.totalJuegos}</span>
            <span>Valor total: USD ${d.biblioteca.total_precio ?? "0"}</span>
            <span>Horas totales: ${d.totalHoras}</span>
          </div>

          <div class="steam-description">
            ${descriptions[i]}
          </div>

          <div class="steam-bottom">
            <div class="seller">Vendedor: ${sellers[i]}</div>
            <div class="price">${prices[i]}</div>
          </div>

        </div>
      `;

      cardsContainer.appendChild(card);
    }
  } catch (err) {
    console.error("Error cargando datos:", err);
  }
}

document.addEventListener("DOMContentLoaded", cargarDatos);
