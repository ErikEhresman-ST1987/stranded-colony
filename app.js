"use strict";

const SAVE_VERSION=2,DB_NAME="stranded-colony",DB_VERSION=1,STORE_NAME="saves",ACTIVE_SAVE_KEY="active-colony";
let gameState=null;
const ui={};
const STARTING_SURVIVORS=[
  {id:"mara-vale",name:"Mara Vale",role:"Systems Technician"},
  {id:"jonas-reed",name:"Jonas Reed",role:"Field Medic"},
  {id:"tessa-kim",name:"Tessa Kim",role:"Survey Specialist"},
  {id:"oren-shaw",name:"Oren Shaw",role:"Fabricator"},
  {id:"lina-torres",name:"Lina Torres",role:"Life Support"}
];

const SaveManager={
  db:null,
  async open(){if(this.db)return this.db;return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,DB_VERSION);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE_NAME))db.createObjectStore(STORE_NAME)};request.onsuccess=()=>{this.db=request.result;this.db.onversionchange=()=>{this.db.close();this.db=null};resolve(this.db)};request.onerror=()=>reject(request.error||new Error("Unable to open local save storage."));request.onblocked=()=>reject(new Error("Local save storage is blocked by another open version of the game."))})},
  async readActiveSave(){const db=await this.open();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE_NAME,"readonly"),request=tx.objectStore(STORE_NAME).get(ACTIVE_SAVE_KEY);request.onsuccess=()=>resolve(request.result??null);request.onerror=()=>reject(request.error||new Error("Unable to read the local save."))})},
  async writeActiveSave(state){const validation=validateGameState(state);if(!validation.ok)throw new Error(validation.message);const db=await this.open(),snapshot=structuredClone(state);return new Promise((resolve,reject)=>{const tx=db.transaction(STORE_NAME,"readwrite");tx.objectStore(STORE_NAME).put(snapshot,ACTIVE_SAVE_KEY);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error("Unable to save the colony."));tx.onabort=()=>reject(tx.error||new Error("The colony save was not completed."))})}
};

function firstColonyState(base){
  const now=new Date().toISOString();
  return{
    saveVersion:SAVE_VERSION,
    meta:base?.meta||{id:crypto.randomUUID?crypto.randomUUID():"colony-"+Date.now(),createdAt:now,updatedAt:now},
    scenario:{worldSeed:base?.scenario?.worldSeed||(crypto.randomUUID?crypto.randomUUID():String(Date.now())),established:{region:"Temperate Frontier",crashSite:true,sites:["emergency-shelter","wreck-salvage"]}},
    playthrough:{turn:base?.playthrough?.turn??0,colony:{status:"Crash site established"},resources:{food:18,water:20,salvage:12},survivors:Object.fromEntries(STARTING_SURVIVORS.map(s=>[s.id,{...s,status:"Ready"}])),assignments:{},projects:{},research:{},flags:{firstColonyState:true}}
  }
}

function migrateGameState(candidate){
  if(candidate?.saveVersion===1)return firstColonyState(candidate);
  return candidate;
}

function validateGameState(candidate){
  if(!candidate||typeof candidate!=="object")return{ok:false,message:"Save data is missing or unreadable."};
  if(candidate.saveVersion!==SAVE_VERSION)return{ok:false,message:candidate.saveVersion>SAVE_VERSION?"This save was created by a newer version of Stranded Colony.":"This save version is not yet supported."};
  if(!candidate.meta||typeof candidate.meta!=="object"||typeof candidate.meta.id!=="string")return{ok:false,message:"Save metadata is incomplete."};
  if(!candidate.scenario||typeof candidate.scenario!=="object")return{ok:false,message:"Scenario data is incomplete."};
  const p=candidate.playthrough;
  if(!p||typeof p!=="object"||!Number.isInteger(p.turn)||p.turn<0)return{ok:false,message:"Playthrough data is incomplete."};
  if(!p.resources||!p.survivors||!p.colony)return{ok:false,message:"Colony state is incomplete."};
  return{ok:true}
}

function createNewGameState(){return firstColonyState(null)}

async function prepareSavedState(candidate){
  if(candidate?.saveVersion===1){
    const migrated=migrateGameState(candidate);
    migrated.meta.updatedAt=new Date().toISOString();
    await SaveManager.writeActiveSave(migrated);
    return migrated;
  }
  return candidate;
}

async function activateState(candidate,statusText){
  const prepared=await prepareSavedState(candidate),validation=validateGameState(prepared);
  if(!validation.ok)throw new Error(validation.message);
  gameState=prepared;render();setSaveStatus(statusText)
}

async function createColony(){
  clearError();
  if(gameState){if(!window.confirm("Replace the current local colony? This early build does not yet include backup/export."))return}
  else{const existing=await SaveManager.readActiveSave();if(existing&&!window.confirm("A saved colony already exists on this device. Replace it with a new colony?"))return}
  setBusy(true);
  try{const candidate=createNewGameState();await SaveManager.writeActiveSave(candidate);await activateState(candidate,"Saved locally")}catch(error){showError(error)}finally{setBusy(false)}
}

async function loadColony(){
  clearError();setBusy(true);
  try{const candidate=await SaveManager.readActiveSave();if(!candidate)throw new Error("No local colony save was found.");await activateState(candidate,candidate.saveVersion===1?"Save upgraded and loaded":"Loaded local save")}catch(error){showError(error)}finally{setBusy(false)}
}

function render(){
  const hasState=Boolean(gameState),p=gameState?.playthrough;
  ui.turnValue.textContent=hasState?String(p.turn):"—";
  ui.survivorValue.textContent=hasState?String(Object.keys(p.survivors).length):"—";
  ui.foodValue.textContent=hasState?String(p.resources.food):"—";
  ui.waterValue.textContent=hasState?String(p.resources.water):"—";
  ui.salvageValue.textContent=hasState?String(p.resources.salvage):"—";
  ui.colonyStatus.textContent=hasState?"Crash site established":"No active colony";
  ui.boardMessage.textContent=hasState?"The survivors have secured emergency shelter beside the broken colony ship. The wreck remains the colony’s first source of usable material.":"Create or load a colony to reveal the first colony state.";
  ui.newGameButton.textContent=hasState?"Start New Colony":"Create New Colony";
  ui.statePanel.hidden=!hasState;
  ui.survivorCluster.replaceChildren();
  ui.survivorList.replaceChildren();
  if(hasState){
    Object.values(p.survivors).forEach(s=>{
      const token=document.createElement("span");token.className="survivor-token";token.title=s.name;ui.survivorCluster.append(token);
      const card=document.createElement("div");card.className="survivor-card";const name=document.createElement("b"),role=document.createElement("small");name.textContent=s.name;role.textContent=s.role;card.append(name,role);ui.survivorList.append(card)
    })
  }
}

function setSaveStatus(text){ui.saveIndicator.textContent=text}
function setBusy(busy){ui.newGameButton.disabled=busy;ui.loadGameButton.disabled=busy}
function showError(error){console.error(error);ui.errorMessage.textContent=error instanceof Error?error.message:"An unexpected local-storage error occurred.";ui.errorMessage.hidden=false;setSaveStatus("Save unavailable")}
function clearError(){ui.errorMessage.hidden=true;ui.errorMessage.textContent=""}

async function initialize(){
  Object.assign(ui,{saveIndicator:document.querySelector("#saveIndicator"),turnValue:document.querySelector("#turnValue"),survivorValue:document.querySelector("#survivorValue"),foodValue:document.querySelector("#foodValue"),waterValue:document.querySelector("#waterValue"),salvageValue:document.querySelector("#salvageValue"),colonyStatus:document.querySelector("#colonyStatus"),boardMessage:document.querySelector("#boardMessage"),newGameButton:document.querySelector("#newGameButton"),loadGameButton:document.querySelector("#loadGameButton"),errorMessage:document.querySelector("#errorMessage"),statePanel:document.querySelector("#statePanel"),survivorList:document.querySelector("#survivorList"),survivorCluster:document.querySelector("#survivorCluster")});
  ui.newGameButton.addEventListener("click",createColony);ui.loadGameButton.addEventListener("click",loadColony);
  try{await SaveManager.open();const existing=await SaveManager.readActiveSave();if(existing){if(existing.saveVersion===1||validateGameState(existing).ok){ui.loadGameButton.hidden=false;setSaveStatus(existing.saveVersion===1?"Local save ready to upgrade":"Local save found")}else{setSaveStatus("Save needs attention");showError(new Error(validateGameState(existing).message))}}else setSaveStatus("Ready for new colony")}catch(error){showError(error)}
  render();
  if("serviceWorker"in navigator)window.addEventListener("load",()=>{navigator.serviceWorker.register("./service-worker.js").catch(error=>console.error("Service worker registration failed:",error))})
}
document.addEventListener("DOMContentLoaded",initialize);