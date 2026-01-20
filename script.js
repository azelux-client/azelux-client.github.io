const imageInput = document.getElementById("imageInput");
const scanBtn = document.getElementById("scanBtn");
const codeOutput = document.getElementById("codeOutput");
const decodedOutput = document.getElementById("decodedOutput");
const downloadBtn = document.getElementById("downloadBtn");

let decodedConfig = null;

/* ---------- UUID GENERATOR ---------- */
function uuidv4() {
  return crypto.randomUUID();
}

/* ---------- GLINT COLOR MAP ---------- */
const GLINT_COLOR_MAP = {
  1: "red",
  2: "orange",
  3: "yellow",
  4: "green",
  5: "light_blue",
  6: "blue",
  7: "magenta",
  8: "white"
};

/* ---------- OCR ---------- */
scanBtn.onclick = async () => {
  if (!imageInput.files[0]) {
    alert("Upload an image first");
    return;
  }

  decodedOutput.innerHTML = "";
  codeOutput.textContent = "Scanning...";
  downloadBtn.disabled = true;

  const { data } = await Tesseract.recognize(
    imageInput.files[0],
    "eng",
    { tessedit_char_whitelist: "acx0123456789" }
  );

  const raw = data.text.replace(/\s+/g, "");
  const match = raw.match(/acx[0-9]+/i);

  if (!match) {
    codeOutput.textContent = "No ACX code found";
    return;
  }

  const acx = match[0];
  codeOutput.textContent = acx;

  decodeACX(acx.substring(3));
};

/* ---------- UI ---------- */
function addLine(label, value) {
  const div = document.createElement("div");
  div.className = "decoded-item";
  div.textContent = `${label}: ${value}`;
  decodedOutput.appendChild(div);
}

/* ---------- ACX DECODE ---------- */
function decodeACX(data) {
  let i = 0;
  const next = () => data[i++] ?? "0";

  decodedConfig = {
    "$armor_hud_main_toggle_default": next() === "1",
    "$armor_hud_split_toggle_default_state": next() === "1",

    "$direction_main_toggle_default": next() === "1",
    "$direction_hud_legacy_toggle_default_state": next() === "1",

    "$glint_colorizer_main_toggle": next() === "1",
    "$custom_glint_color_default_selected": Number(next()),

    "$totem_counter_main_toggle": next() === "1",
    "$totem_counter_background_toggle_default_state": next() === "1",

    "$server_address_main_toggle": next() === "1",
    "$server_address_background_toggle_default_state": next() === "1",
    "$server_address_icon_toggle_default_state": next() === "1",

    "$shiny_pots_main_toggle": next() === "1",
    "$shiny_pots_color_default_selected": Number(next()),

    "$moving_status_main_toggle": next() === "1",
    "$moving_status_background_toggle_default_state": next() === "1",

    "$custom_crosshair_main_toggle": next() === "1",
    "$custom_crosshair_default_selected": Number(next()),
    "$custom_crosshair_default_color_toggle_default_state": next() === "1",
    "$custom_crosshair_color_default_selected": Number(next()),

    "$tab_list_main_toggle": next() === "1",
    "$player_list_background_toggle_default_state": next() === "1",
    "$player_list_icon_toggle_default_state": next() === "1",

    "$emote_disabler_default_state": next() === "1",
    "$low_fire_toggle_default_state": next() === "1",
    "$better_grass_toggle_default_state": next() === "1",

    "$cape_default_selected": Number(next()),
    "$wings_default_selected": Number(next()),
    "$halo_default_selected": Number(next()),
    "$shields_default_selected": Number(next()),
    "$players_default_selected": Number(next()),

    "$azelux_config_version": "0.1"
  };

  decodedOutput.innerHTML = "";
  for (const [k, v] of Object.entries(decodedConfig)) {
    addLine(k, v);
  }

  downloadBtn.disabled = false;
}

/* ---------- ZIP EXPORT ---------- */
downloadBtn.onclick = async () => {
  if (!decodedConfig) return;

  const zip = new JSZip();

  // ---------------- UI ----------------
  zip.folder("ui").file(
    "_global_variables.json",
    JSON.stringify(decodedConfig, null, 2)
  );

  // ---------------- ENTITY ----------------
  const emotesDisabled = decodedConfig["$emote_disabler_default_state"];
  zip.folder("entity").file(
    "player.entity.json",
    JSON.stringify({
      format_version: "1.10.0",
      "minecraft:client_entity": {
        description: {
          identifier: "minecraft:player",
          textures: {
            halo: `textures/azelux/cosmetics/halo${decodedConfig["$halo_default_selected"]}`,
            azelux_cape: `textures/azelux/cosmetics/capes/cape${decodedConfig["$cape_default_selected"]}`,
            wings: `textures/azelux/cosmetics/wings/wings${decodedConfig["$wings_default_selected"]}`,
            shield: `textures/azelux/cosmetics/shields/shield${decodedConfig["$shields_default_selected"]}`,
            charged: `textures/azelux/cosmetics/players/creeper_armor${decodedConfig["$players_default_selected"]}`
          },
          animations: {
            emotes: "controller.animation.sigmaemote",
            "animation.player.floss_dance": emotesDisabled ? "0" : "animation.player.floss_dance",
            "animation.player.griddy": emotesDisabled ? "0" : "animation.player.griddy",
            "animation.player.dab": emotesDisabled ? "0" : "animation.player.dab",
            "animation.player.pray": emotesDisabled ? "0" : "animation.player.pray"
          }
        }
      }
    }, null, 2)
  );

  // ---------------- ENCHANT GLINT ----------------
  if (decodedConfig["$glint_colorizer_main_toggle"]) {
    const colorName = GLINT_COLOR_MAP[decodedConfig["$custom_glint_color_default_selected"]];
    const actorPath = `glint_assets/${colorName}_actor_enchant_glint.png`;
    const itemPath = `glint_assets/${colorName}_enchant_glint.png`;

    const addGlintFile = async (filePath, zipPath) => {
      try {
        const res = await fetch(filePath);
        if (!res.ok) {
          console.warn(`Glint file not found: ${filePath}`);
          return;
        }
        const blob = await res.blob();
        zip.file(zipPath, blob);
      } catch (e) {
        console.warn(`Failed to load glint file: ${filePath}`, e);
      }
    };

    await addGlintFile(actorPath, "textures/misc/enchanted_actor_glint.png");
    await addGlintFile(itemPath, "textures/misc/enchanted_item_glint.png");
  }

  // ---------------- CUSTOM CROSSHAIR ----------------
  if (decodedConfig["$custom_crosshair_default_color_toggle_default_state"]) {
    const crosshairIndex = decodedConfig["$custom_crosshair_default_selected"];
    const crosshairPath = `crosshair_assets/crosshair${crosshairIndex}.png`;

    const addCrosshairFile = async (filePath, zipPath) => {
      try {
        const res = await fetch(filePath);
        if (!res.ok) {
          console.warn(`Crosshair file not found: ${filePath}`);
          return;
        }
        const blob = await res.blob();
        zip.file(zipPath, blob);
      } catch (e) {
        console.warn(`Failed to load crosshair file: ${filePath}`, e);
      }
    };

    await addCrosshairFile(crosshairPath, "textures/ui/cross_hair.png");
  }

  // ---------------- PACK ICON ----------------
  try {
    const iconRes = await fetch("pack_icon.png"); // pack_icon.png neben index.html ablegen
    if (iconRes.ok) {
      const iconBlob = await iconRes.blob();
      zip.file("pack_icon.png", iconBlob);
    } else {
      console.warn("pack_icon.png not found in website folder");
    }
  } catch(e) {
    console.warn("Failed to load pack_icon.png", e);
  }

  // ---------------- MANIFEST ----------------
  const now = new Date();
  const formattedDate = now.toLocaleString();

  zip.file(
    "manifest.json",
    JSON.stringify({
      format_version: 1,
      header: {
        description: `Azelux Client Custom Config!\nGenerated: ${formattedDate}`,
        name: "Azelux Client Config",
        uuid: uuidv4(),
        version: [7, 1, 0]
      },
      modules: [
        {
          description: "V1.0.0",
          type: "resources",
          uuid: uuidv4(),
          version: [7, 1, 0]
        }
      ]
    }, null, 2)
  );

  // ---------------- DOWNLOAD ----------------
  const blob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "acx_resourcepack.mcpack"; // automatisch .mcpack
  a.click();
  URL.revokeObjectURL(a.href);
};
