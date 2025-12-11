import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const API_KEY = process.env.STEAM_API_KEY;

// Obtener perfil (incluye fecha de creación)
app.get("/steam/:steamid/profile", async (req, res) => {
  const { steamid } = req.params;

  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${API_KEY}&steamids=${steamid}`;

  try {
    const resp = await fetch(url);
    const json = await resp.json();

    if (!json.response.players.length) {
      return res.status(404).json({ error: "No se encontró el perfil" });
    }

    res.json(json.response.players[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo perfil" });
  }
});

app.get("/steam/:steamid/library", async (req, res) => {
    const { steamid } = req.params;

    try {
        // Obtener biblioteca
        const libraryURL = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${API_KEY}&steamid=${steamid}&include_appinfo=true&include_played_free_games=true`;

        const libRes = await fetch(libraryURL);
        const libJson = await libRes.json();

        if (!libJson?.response?.games) {
            return res.status(400).json({ error: "No se pudo obtener la biblioteca" });
        }

        const games = libJson.response.games;

        let totalPrecio = 0;
        let totalHoras = 0;

        const resultados = [];

        for (const game of games) {
            const horas = game.playtime_forever
                ? Math.round(game.playtime_forever / 60)
                : 0;

            totalHoras += horas;

            // PEDIDO INDIVIDUAL CON TRY-CATCH POR SI DEVUELVE HTML
            let precio = null;

            try {
                const priceURL = `https://store.steampowered.com/api/appdetails?appids=${game.appid}&cc=us&l=english`;
                const priceRes = await fetch(priceURL);

                // A veces Steam devuelve HTML → verificar antes de usar JSON
                const rawText = await priceRes.text();
                let priceJson;

                try {
                    priceJson = JSON.parse(rawText);
                } catch {
                    priceJson = null; // Steam devolvió HTML → no hay precio
                }

                const info = priceJson?.[game.appid]?.data?.price_overview;

                if (info) {
                    precio = info.final / 100;
                    totalPrecio += precio;
                }

            } catch {
                // Si falla, no crashea
            }

            resultados.push({
                appid: game.appid,
                nombre: game.name,
                horas,
                precio,
                moneda: "USD"
            });
        }

        return res.json({
            total_precio: parseFloat(totalPrecio.toFixed(2)),
            total_horas: totalHoras,
            total_juegos: games.length,
            moneda: "USD",
            juegos: resultados
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno" });
    }
});



app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
