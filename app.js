"use strict";

const SAVE_VERSION = 1;
const DB_NAME = "stranded-colony";
const DB_VERSION = 1;
const STORE_NAME = "saves";
const ACTIVE_SAVE_KEY = "active-colony";

let gameState = null;

const ui = {};

const SaveManager = {
  db: null,

  async open() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        this.db.onversionchange = () => {
          this.db.close();
          this.db = null;
        };
        resolve(this.db);
      };
      request.onerror = () => reject(request.error || new Error("Unable to open local save storage."));
      request.onblocked = () => reject(new Error("Local save storage is blocked by another open version of the game."));
    });
  },

  async readActiveSave() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(ACTIVE_SAVE_KEY);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error || new Error("Unable to read the local save."));
    });
  },

  async writeActiveSave(state) {
    const validation = validateGameState(state);
    if (!validation.ok) throw new Error(validation.message);
    const db = await this.open();
    const snapshot = structuredClone(state);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(snapshot, ACTIVE_SAVE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error("Unable to save the colony."));
      tx.onabort = () => reject(tx.error || new Error("The colony save was not completed."));
    });
  }
};

function validateGameState(candidate) {
  if (!candidate || typeof candidate !== "object") return { ok: false, message: "Save data is missing or unreadable." };
  if (candidate.saveVersion !== SAVE_VERSION) {
    return { ok: false, message: candidate.saveVersion > SAVE_VERSION ? "This save was created by a newer version of Stranded Colony." : "This save version is not yet supported." };
  }
  if (!candidate.meta || typeof candidate.meta !== "object" || typeof candidate.meta.id !== "string") return { ok: false, message: "Save metadata is incomplete." };
  if (!candidate.scenario || typeof candidate.scenario !== "object") return { ok: false, message: "Scenario data is incomplete." };
  if (!candidate.playthrough || typeof candidate.playthrough !== "object" || !Number.isInteger(candidate.playthrough.turn) || candidate.playthrough.turn < 0) return { ok: false, message: "Playthrough data is incomplete." };
  return { ok: true };
}

function createNewGameState() {
  const now = new Date().toISOString();
  return {
    saveVersion: SAVE_VERSION,
    meta: {
      id: crypto.randomUUID ? crypto.randomUUID() : "colony-" + Date.now(),
      createdAt: now,
      updatedAt: now
    },
    scenario: {
      worldSeed: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      established: {}
    },
    playthrough: {
      turn: 0,
      colony: {},
      resources: {},
      survivors: {},
      assignments: {},
      projects: {},
      research: {},
      flags: {}
    }
  };
}

async function activateState(candidate, statusText) {
  const validation = validateGameState(candidate);
  if (!validation.ok) throw new Error(validation.message);
  gameState = candidate;
  render();
  setSaveStatus(statusText);
}

async function createColony() {
  clearError();
  if (gameState) {
    const replace = window.confirm("Replace the current local colony? This Increment 1 foundation does not yet include backup/export.");
    if (!replace) return;
  } else {
    const existing = await SaveManager.readActiveSave();
    if (existing) {
      const replace = window.confirm("A saved colony already exists on this device. Replace it with a new colony?");
      if (!replace) return;
    }
  }

  setBusy(true);
  try {
    const candidate = createNewGameState();
    await SaveManager.writeActiveSave(candidate);
    await activateState(candidate, "Saved locally");
  } catch (error) {
    showError(error);
  } finally {
    setBusy(false);
  }
}

async function loadColony() {
  clearError();
  setBusy(true);
  try {
    const candidate = await SaveManager.readActiveSave();
    if (!candidate) throw new Error("No local colony save was found.");
    await activateState(candidate, "Loaded local save");
  } catch (error) {
    showError(error);
  } finally {
    setBusy(false);
  }
}

function render() {
  const hasState = Boolean(gameState);
  ui.turnValue.textContent = hasState ? String(gameState.playthrough.turn) : "—";
  ui.colonyStatus.textContent = hasState ? "Foundation ready" : "No active colony";
  ui.boardMessage.textContent = hasState
    ? "Local colony state is active. The crash-site board and first playable colony state are intentionally reserved for Increment 2."
    : "Create a colony to establish a local save. The playable crash site will arrive in the next verified increment.";
  ui.newGameButton.textContent = hasState ? "Start New Colony" : "Create New Colony";
}

function setSaveStatus(text) {
  ui.saveIndicator.textContent = text;
}

function setBusy(busy) {
  ui.newGameButton.disabled = busy;
  ui.loadGameButton.disabled = busy;
}

function showError(error) {
  console.error(error);
  ui.errorMessage.textContent = error instanceof Error ? error.message : "An unexpected local-storage error occurred.";
  ui.errorMessage.hidden = false;
  setSaveStatus("Save unavailable");
}

function clearError() {
  ui.errorMessage.hidden = true;
  ui.errorMessage.textContent = "";
}

async function initialize() {
  Object.assign(ui, {
    saveIndicator: document.querySelector("#saveIndicator"),
    turnValue: document.querySelector("#turnValue"),
    colonyStatus: document.querySelector("#colonyStatus"),
    boardMessage: document.querySelector("#boardMessage"),
    newGameButton: document.querySelector("#newGameButton"),
    loadGameButton: document.querySelector("#loadGameButton"),
    errorMessage: document.querySelector("#errorMessage")
  });

  ui.newGameButton.addEventListener("click", createColony);
  ui.loadGameButton.addEventListener("click", loadColony);

  try {
    await SaveManager.open();
    const existing = await SaveManager.readActiveSave();
    if (existing) {
      const validation = validateGameState(existing);
      if (validation.ok) {
        ui.loadGameButton.hidden = false;
        setSaveStatus("Local save found");
      } else {
        setSaveStatus("Save needs attention");
        showError(new Error(validation.message));
      }
    } else {
      setSaveStatus("Ready for new colony");
    }
  } catch (error) {
    showError(error);
  }

  render();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch((error) => console.error("Service worker registration failed:", error));
    });
  }
}

document.addEventListener("DOMContentLoaded", initialize);
