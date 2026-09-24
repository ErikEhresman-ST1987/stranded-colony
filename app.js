"use strict";

const SAVE_VERSION=2,DB_NAME="stranded-colony",DB_VERSION=1,STORE_NAME="saves",ACTIVE_SAVE_KEY="active-colony";
let gameState=null;
const ui={};
const WORK_OPTIONS=[["unassigned","Unassigned"],["shelter","Maintain Shelter"],["salvage","Salvage Wreck"],["forage","Forage for Food"],["water","Secure Water"]];
const TURN_RULES={foodPerSurvivor:1,waterPerSurvivor:1,forageFood:3,secureWater:3,salvageYield:3};
const PROJECTS={waterCollector:{id:"water-collector",name:"Water Collector",salvageCost:9,waterPerTurn:2}};
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
  async readActiveSave(){const db=await this.open();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE_NAME,"readonly"),request=tx.objectStore(STORE_NAME).get(ACTIVE_SAVE_KEY);let result=null;request.onsuccess=()=>{result=request.result??null};request.onerror=()=>reject(request.error||new Error("Unable to read the local save."));tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error||new Error("Unable to read the local save."));tx.onabort=()=>reject(tx.error||new Error("The local save read was interrupted."))})},
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
  clearError();setBusy(true);setSaveStatus("Loading local save…");
  try{const candidate=await SaveManager.readActiveSave();if(!candidate)throw new Error("No local colony save was found.");const wasV1=candidate.saveVersion===1;await activateState(candidate,wasV1?"Save upgraded and loaded":"Loaded local save")}catch(error){showError(error)}finally{setBusy(false)}
}

function validateTurnPlan(state){
  const survivorIds=Object.keys(state.playthrough.survivors),assignments=state.playthrough.assignments;
  const invalid=Object.keys(assignments).find(id=>!survivorIds.includes(id)||!WORK_OPTIONS.some(([workId])=>workId===assignments[id]));
  return invalid?{ok:false,message:"One or more work assignments are invalid."}:{ok:true}
}

function resolveTurn(sourceState){
  const next=structuredClone(sourceState),p=next.playthrough,plan=validateTurnPlan(next);
  if(!plan.ok)throw new Error(plan.message);
  const survivorCount=Object.keys(p.survivors).length,counts={shelter:0,salvage:0,forage:0,water:0};
  Object.values(p.assignments).forEach(id=>{if(id in counts)counts[id]++});
  const collectorBuilt=Boolean(p.projects?.[PROJECTS.waterCollector.id]?.complete),collectorWater=collectorBuilt?PROJECTS.waterCollector.waterPerTurn:0;
  const delta={food:counts.forage*TURN_RULES.forageFood-survivorCount*TURN_RULES.foodPerSurvivor,water:counts.water*TURN_RULES.secureWater+collectorWater-survivorCount*TURN_RULES.waterPerSurvivor,salvage:counts.salvage*TURN_RULES.salvageYield};
  p.resources.food=Math.max(0,p.resources.food+delta.food);
  p.resources.water=Math.max(0,p.resources.water+delta.water);
  p.resources.salvage=Math.max(0,p.resources.salvage+delta.salvage);
  p.turn+=1;
  p.flags.lastTurn={turn:p.turn,delta,counts,improvements:{waterCollector:collectorWater}};
  next.meta.updatedAt=new Date().toISOString();
  return next
}

async function commitTurn(){
  if(!gameState)return;
  clearError();setBusy(true);ui.commitTurnButton.disabled=true;setSaveStatus("Resolving turn…");
  try{
    const next=resolveTurn(gameState);
    await SaveManager.writeActiveSave(next);
    gameState=next;render();
    const last=gameState.playthrough.flags.lastTurn;
    ui.turnResult.textContent="Turn "+last.turn+" resolved • Food "+signed(last.delta.food)+" • Water "+signed(last.delta.water)+" • Salvage "+signed(last.delta.salvage);
    ui.turnResult.hidden=false;setSaveStatus("Turn saved")
  }catch(error){showError(error)}finally{setBusy(false);ui.commitTurnButton.disabled=false}
}
function signed(value){return value>0?"+"+value:String(value)}

async function buildWaterCollector(){
  if(!gameState)return;
  clearError();
  const project=PROJECTS.waterCollector,p=gameState.playthrough;
  if(p.projects?.[project.id]?.complete)return;
  if(p.resources.salvage<project.salvageCost){showError(new Error("The colony needs "+project.salvageCost+" Salvage to build the Water Collector."));return}
  const next=structuredClone(gameState);
  next.playthrough.resources.salvage-=project.salvageCost;
  next.playthrough.projects[project.id]={complete:true,builtTurn:next.playthrough.turn};
  next.meta.updatedAt=new Date().toISOString();
  setBusy(true);
  try{await SaveManager.writeActiveSave(next);gameState=next;render();setSaveStatus("Improvement built")}catch(error){showError(error)}finally{setBusy(false)}
}

async function changeAssignment(event){
  if(!gameState)return;
  const survivorId=event.target.dataset.survivorId,workId=event.target.value,previous=gameState.playthrough.assignments[survivorId];
  if(!WORK_OPTIONS.some(([id])=>id===workId))return;
  if(workId==="unassigned")delete gameState.playthrough.assignments[survivorId];else gameState.playthrough.assignments[survivorId]=workId;
  gameState.meta.updatedAt=new Date().toISOString();
  try{await SaveManager.writeActiveSave(gameState);render();setSaveStatus("Assignment saved")}catch(error){if(previous)gameState.playthrough.assignments[survivorId]=previous;else delete gameState.playthrough.assignments[survivorId];render();showError(error)}
}

function render(){
  const hasState=Boolean(gameState),p=gameState?.playthrough;
  ui.turnValue.textContent=hasState?String(p.turn):"—";
  ui.survivorValue.textContent=hasState?String(Object.keys(p.survivors).length):"—";
  ui.foodValue.textContent=hasState?String(p.resources.food):"—";
  ui.waterValue.textContent=hasState?String(p.resources.water):"—";
  ui.salvageValue.textContent=hasState?String(p.resources.salvage):"—";
  const assigned=hasState?Object.keys(p.assignments).length:0;
  ui.assignedValue.textContent=hasState?assigned+"/5":"—";
  ui.colonyStatus.textContent=hasState?"Crash site established":"No active colony";
  ui.boardMessage.textContent=hasState?"Set the work plan, then commit the turn. The colony consumes 1 Food and 1 Water per survivor; assigned work produces resources before the resulting state is saved.":"Create or load a colony to reveal the first colony state.";
  ui.newGameButton.textContent=hasState?"Start New Colony":"Create New Colony";
  ui.statePanel.hidden=!hasState;
  ui.projectPanel.hidden=!hasState;
  ui.survivorCluster.replaceChildren();
  ui.survivorList.replaceChildren();
  if(hasState){
    Object.values(p.survivors).forEach(s=>{
      const token=document.createElement("span");token.className="survivor-token";token.title=s.name;ui.survivorCluster.append(token);
      const card=document.createElement("div");card.className="survivor-card";const name=document.createElement("b"),role=document.createElement("small"),select=document.createElement("select");name.textContent=s.name;role.textContent=s.role;select.dataset.survivorId=s.id;select.setAttribute("aria-label","Assignment for "+s.name);WORK_OPTIONS.forEach(([id,label])=>{const option=document.createElement("option");option.value=id;option.textContent=label;select.append(option)});select.value=p.assignments[s.id]||"unassigned";select.addEventListener("change",changeAssignment);if(select.value!=="unassigned")card.classList.add("assigned");card.append(name,role,select);ui.survivorList.append(card)
    });
    const counts={shelter:0,salvage:0,forage:0,water:0};Object.values(p.assignments).forEach(id=>{if(id in counts)counts[id]++});
    ui.assignmentSummary.textContent=assigned+" of 5 assigned • Shelter "+counts.shelter+" • Salvage "+counts.salvage+" • Food "+counts.forage+" • Water "+counts.water;
    ui.commitTurnButton.disabled=false;
    const project=PROJECTS.waterCollector,built=Boolean(p.projects?.[project.id]?.complete),canBuild=p.resources.salvage>=project.salvageCost;
    ui.projectPanel.classList.toggle("complete",built);ui.buildProjectButton.hidden=built;ui.buildProjectButton.disabled=!canBuild;
    ui.projectStatus.textContent=built?"Built • +2 Water each turn":canBuild?"Ready to build":"Needs "+(project.salvageCost-p.resources.salvage)+" more Salvage";
  }else{ui.commitTurnButton.disabled=true;ui.turnResult.hidden=true}
  if(hasState&&p.flags.lastTurn&&!ui.turnResult.textContent){const last=p.flags.lastTurn;ui.turnResult.textContent="Last resolved: Turn "+last.turn+" • Food "+signed(last.delta.food)+" • Water "+signed(last.delta.water)+" • Salvage "+signed(last.delta.salvage);ui.turnResult.hidden=false}
}

function setSaveStatus(text){ui.saveIndicator.textContent=text}
function setBusy(busy){ui.newGameButton.disabled=busy;ui.loadGameButton.disabled=busy;if(ui.commitTurnButton)ui.commitTurnButton.disabled=busy;if(ui.buildProjectButton&&!ui.buildProjectButton.hidden)ui.buildProjectButton.disabled=busy}
function showError(error){console.error(error);ui.errorMessage.textContent=error instanceof Error?error.message:"An unexpected local-storage error occurred.";ui.errorMessage.hidden=false;setSaveStatus("Save unavailable")}
function clearError(){ui.errorMessage.hidden=true;ui.errorMessage.textContent=""}

async function initialize(){
  Object.assign(ui,{saveIndicator:document.querySelector("#saveIndicator"),turnValue:document.querySelector("#turnValue"),survivorValue:document.querySelector("#survivorValue"),foodValue:document.querySelector("#foodValue"),waterValue:document.querySelector("#waterValue"),salvageValue:document.querySelector("#salvageValue"),assignedValue:document.querySelector("#assignedValue"),colonyStatus:document.querySelector("#colonyStatus"),boardMessage:document.querySelector("#boardMessage"),newGameButton:document.querySelector("#newGameButton"),loadGameButton:document.querySelector("#loadGameButton"),errorMessage:document.querySelector("#errorMessage"),statePanel:document.querySelector("#statePanel"),survivorList:document.querySelector("#survivorList"),assignmentSummary:document.querySelector("#assignmentSummary"),commitTurnButton:document.querySelector("#commitTurnButton"),projectPanel:document.querySelector("#projectPanel"),buildProjectButton:document.querySelector("#buildProjectButton"),projectStatus:document.querySelector("#projectStatus"),turnResult:document.querySelector("#turnResult"),survivorCluster:document.querySelector("#survivorCluster")});
  ui.newGameButton.addEventListener("click",createColony);ui.loadGameButton.addEventListener("click",loadColony);ui.commitTurnButton.addEventListener("click",commitTurn);ui.buildProjectButton.addEventListener("click",buildWaterCollector);
  try{await SaveManager.open();const existing=await SaveManager.readActiveSave();if(existing){if(existing.saveVersion===1||validateGameState(existing).ok){ui.loadGameButton.hidden=false;setSaveStatus(existing.saveVersion===1?"Local save ready to upgrade":"Local save found")}else{setSaveStatus("Save needs attention");showError(new Error(validateGameState(existing).message))}}else setSaveStatus("Ready for new colony")}catch(error){showError(error)}
  render();
  if("serviceWorker"in navigator)window.addEventListener("load",()=>{navigator.serviceWorker.register("./service-worker.js").catch(error=>console.error("Service worker registration failed:",error))})
}
document.addEventListener("DOMContentLoaded",initialize);