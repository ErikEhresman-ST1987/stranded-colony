"use strict";

const SAVE_VERSION=10,DB_NAME="stranded-colony",DB_VERSION=1,STORE_NAME="saves",ACTIVE_SAVE_KEY="active-colony";
let gameState=null;
const ui={};
const WORK_OPTIONS=[["unassigned","Unassigned"],["shelter","Maintain Shelter"],["salvage","Salvage Wreck"],["forage","Forage for Food"],["water","Secure Water"],["survey-ridge","Survey Northern Ridge"],["investigate-ridge","Investigate Ridge Moisture"],["evaluate-spring","Evaluate Spring"],["build-spring-line","Build Spring Water Line"],["assess-food","Assess Food Sources"],["assess-power","Assess Power Systems"],["assess-shelter","Assess Shelter Upgrade"]];
const TURN_RULES={foodPerSurvivor:1,waterPerSurvivor:1,forageFood:3,secureWater:3,salvageYield:3};
const PROJECTS={waterCollector:{id:"water-collector",name:"Water Collector",salvageCost:9,waterPerTurn:2},springLine:{id:"spring-line",name:"Spring Water Line",salvageCost:15,workRequired:3}};
const RESEARCH={efficientSalvage:{id:"efficient-salvage",name:"Efficient Salvage",salvageCost:12,salvageYield:5}};
const EVENTS={shelterWear:{id:"shelter-wear",salvageLoss:2}};
const STARTING_REGIONAL_KNOWLEDGE={
  northernRidge:{
    id:"northern-ridge",
    name:"Northern Ridge",
    status:"Observed",
    observation:"Vegetation appears unusually dense along part of the upper slope. No visible drainage was identified during initial reconnaissance. Area not closely surveyed.",
    observer:"Nia Saye",
    interpretation:"The vegetation difference is real, but the cause is not yet known."
  }
};
const STARTING_SURVIVORS=[
  {id:"mara-venn",name:"Mara Venn",role:"Agriculture & Practical Systems"},
  {id:"nia-saye",name:"Nia Saye",role:"Geology & Surveying"},
  {id:"elena-sato",name:"Elena Sato",role:"Logistics & Coordination"},
  {id:"kei-arun",name:"Kei Arun",role:"Engineering & Power"},
  {id:"tomas-vale",name:"Tomas Vale",role:"Medicine & Environmental Safety"},
  {id:"jonah-reed",name:"Jonah Reed",role:"Piloting & Communications"}
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
    scenario:{worldSeed:base?.scenario?.worldSeed||(crypto.randomUUID?crypto.randomUUID():String(Date.now())),established:{region:"Temperate Frontier",crashSite:true,sites:["emergency-shelter","wreck-salvage"],regionalKnowledge:structuredClone(STARTING_REGIONAL_KNOWLEDGE)}},
    playthrough:{turn:base?.playthrough?.turn??0,colony:{status:"Fragile stability"},resources:{food:24,water:24,salvage:12},survivors:Object.fromEntries(STARTING_SURVIVORS.map(s=>[s.id,{...s,status:"Ready"}])),assignments:{},projects:{},research:{},flags:{firstColonyState:true}}
  }
}

function migrateGameState(candidate){
  if(candidate?.saveVersion===3||candidate?.saveVersion===4||candidate?.saveVersion===5||candidate?.saveVersion===6||candidate?.saveVersion===7||candidate?.saveVersion===8||candidate?.saveVersion===9){
    const migrated=structuredClone(candidate);
    migrated.saveVersion=SAVE_VERSION;
    migrated.scenario.established={...(migrated.scenario.established||{}),regionalKnowledge:migrated.scenario?.established?.regionalKnowledge?structuredClone(migrated.scenario.established.regionalKnowledge):structuredClone(STARTING_REGIONAL_KNOWLEDGE)};
    migrated.meta.updatedAt=new Date().toISOString();
    return migrated;
  }
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
  const migrated=migrateGameState(candidate);
  if(candidate?.saveVersion===3||candidate?.saveVersion===4||candidate?.saveVersion===5||candidate?.saveVersion===6||candidate?.saveVersion===7||candidate?.saveVersion===8||candidate?.saveVersion===9)await SaveManager.writeActiveSave(migrated);
  return migrated
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
  const before={...p.resources},survivorCount=Object.keys(p.survivors).length,counts={shelter:0,salvage:0,forage:0,water:0,"survey-ridge":0,"investigate-ridge":0,"evaluate-spring":0,"build-spring-line":0,"assess-food":0,"assess-power":0,"assess-shelter":0};
  Object.values(p.assignments).forEach(id=>{if(id in counts)counts[id]++});

  // Consume
  p.resources.food=Math.max(0,p.resources.food-survivorCount*TURN_RULES.foodPerSurvivor);
  const springLineComplete=Boolean(p.projects?.[PROJECTS.springLine.id]?.complete);
  const baseWaterNeed=springLineComplete?0:survivorCount*TURN_RULES.waterPerSurvivor;
  p.resources.water=Math.max(0,p.resources.water-baseWaterNeed);

  // Produce
  const collectorBuilt=Boolean(p.projects?.[PROJECTS.waterCollector.id]?.complete),collectorWater=collectorBuilt?PROJECTS.waterCollector.waterPerTurn:0;
  const efficientSalvage=Boolean(p.research?.[RESEARCH.efficientSalvage.id]?.complete),salvageYield=efficientSalvage?RESEARCH.efficientSalvage.salvageYield:TURN_RULES.salvageYield;
  p.resources.food+=counts.forage*TURN_RULES.forageFood;
  p.resources.water+=counts.water*TURN_RULES.secureWater+collectorWater;
  p.resources.salvage+=counts.salvage*salvageYield;

  // Progress knowledge through committed survivor capacity.
  let knowledgeUpdate=null;
  const ridge=p.scenario?.established?.regionalKnowledge?.northernRidge||next.scenario?.established?.regionalKnowledge?.northernRidge;
  if(counts["survey-ridge"]>0&&next.scenario?.established?.regionalKnowledge?.northernRidge){
    const r=next.scenario.established.regionalKnowledge.northernRidge;
    if(r.status==="Observed"){
      r.status="Surveyed";
      r.observation="The dense vegetation follows a narrow band across the upper slope. The ground there is cooler and noticeably damp beneath the surface, though no open water or visible drainage has been found.";
      r.interpretation="The pattern is consistent with a local water source or unusually persistent subsurface moisture. It is worth investigating, but the survey does not establish the cause.";
      r.surveyedTurn=p.turn+1;
      knowledgeUpdate={title:"Northern Ridge Survey",message:"A closer survey found cooler, damp ground beneath the dense vegetation. The cause remains unconfirmed."};
    }
  }

  if(counts["investigate-ridge"]>0&&next.scenario?.established?.regionalKnowledge?.northernRidge){
    const r=next.scenario.established.regionalKnowledge.northernRidge;
    if(r.status==="Surveyed"){
      r.status="Spring Confirmed";
      r.observation="Following the damp band upslope led to a small, clear spring emerging from fractured rock above the colony. The source is roughly 34 meters higher than the crash site and appears to have steady flow.";
      r.interpretation="The spring is a real potential water source, but finding it does not make it usable. Flow, safety, route, materials, and the labor needed to move water downhill still have to be evaluated.";
      r.confirmedTurn=p.turn+1;
      knowledgeUpdate={title:"Spring Confirmed",message:"A focused ridge investigation found a small spring above the colony. It is a possibility, not yet a water solution."};
    }
  }

  if(counts["evaluate-spring"]>0&&next.scenario?.established?.regionalKnowledge?.northernRidge){
    const r=next.scenario.established.regionalKnowledge.northernRidge;
    if(r.status==="Spring Confirmed"){
      r.status="Spring Evaluated";
      r.observation="The spring has steady enough flow to matter, and its elevation could allow water to move downhill without continuous hauling. The route is workable but crosses rough ground; a dependable system would require recovered pipe or channel material, secure intake work, and construction labor.";
      r.interpretation="The spring can reduce the colony's water-labor burden, but only after deliberate infrastructure work. Water safety still needs to be respected, and the colony must choose when it can afford the materials and labor.";
      r.evaluatedTurn=p.turn+1;
      knowledgeUpdate={title:"Spring Evaluated",message:"The spring is a practical opportunity. It could free survivor labor, but only after the colony commits materials and construction effort."};
    }
  }

  // Progress committed infrastructure work.
  let projectUpdate=null;
  if(counts["build-spring-line"]>0&&next.playthrough.projects?.[PROJECTS.springLine.id]?.started&&!next.playthrough.projects[PROJECTS.springLine.id].complete){
    const project=next.playthrough.projects[PROJECTS.springLine.id];
    project.work=Math.min(PROJECTS.springLine.workRequired,(project.work||0)+counts["build-spring-line"]);
    if(project.work>=PROJECTS.springLine.workRequired){
      project.complete=true;project.completedTurn=p.turn+1;
      projectUpdate={title:"Spring Water Line Complete",message:"The spring line is complete. Its water-labor benefit will be introduced in the next verified capability step."};
    }else projectUpdate={title:"Spring Water Line Progress",message:"Construction advanced to "+project.work+" of "+PROJECTS.springLine.workRequired+" work."};
  }

  // Open the colony after the guided water arc with competing player-directed assessments.
  p.flags.opportunities={...(p.flags.opportunities||{})};
  const opportunityDefs=[
    ["assess-food","food","Food Sources Assessed","Mara Venn","Nearby edible plants and workable soil offer possibilities, but dependable food production will require choosing what to test and where to invest labor."],
    ["assess-power","power","Power Systems Assessed","Kei Arun","Emergency power is stable enough for essentials. Expanding capacity will require recovered components and a deliberate repair or generation project."],
    ["assess-shelter","shelter","Shelter Upgrade Assessed","Elena Sato","The emergency shelter can be made more dependable, but improving it will compete for salvage and construction labor with other colony priorities."]
  ];
  for(const [workId,key,title,observer,message] of opportunityDefs){
    if(counts[workId]>0&&!p.flags.opportunities[key]){
      p.flags.opportunities[key]={assessed:true,turn:p.turn+1,observer,message};
      knowledgeUpdate=knowledgeUpdate||{title,message};
    }
  }

  // Resolve risks and consequences
  p.turn+=1;
  let event=null;
  const shelterWearResolved=Boolean(p.flags.events?.[EVENTS.shelterWear.id]?.resolved);
  if(!shelterWearResolved&&counts.shelter===0){
    const loss=Math.min(EVENTS.shelterWear.salvageLoss,p.resources.salvage);
    p.resources.salvage-=loss;
    p.flags.events={...(p.flags.events||{}),[EVENTS.shelterWear.id]:{resolved:true,turn:p.turn,salvageLost:loss}};
    event={id:EVENTS.shelterWear.id,title:"Shelter Wear",salvageLost:loss,message:"With no survivor maintaining the emergency shelter, loose crash debris damaged the shelter frame. Emergency repairs used "+loss+" Salvage."};
  }

  // Finalize from actual before/after values so scarcity never misreports a nominal delta.
  const delta={food:p.resources.food-before.food,water:p.resources.water-before.water,salvage:p.resources.salvage-before.salvage};
  p.flags.lastTurn={turn:p.turn,delta,counts,knowledgeUpdate,projectUpdate,improvements:{waterCollector:collectorWater},capabilities:{efficientSalvage,salvageYield,springWaterLine:springLineComplete,baseWaterNeed},event};
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
    ui.turnResult.textContent="Turn "+last.turn+" resolved • Food "+signed(last.delta.food)+" • Water "+signed(last.delta.water)+" • Salvage "+signed(last.delta.salvage)+(last.event?" • Event: "+last.event.title:"")+(last.knowledgeUpdate?" • Discovery: "+last.knowledgeUpdate.title:"")+(last.projectUpdate?" • Project: "+last.projectUpdate.title:"");
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

async function startSpringLine(){
  if(!gameState)return;
  clearError();
  const p=gameState.playthrough,project=PROJECTS.springLine,ridge=gameState.scenario?.established?.regionalKnowledge?.northernRidge;
  if(ridge?.status!=="Spring Evaluated"||p.projects?.[project.id]?.started)return;
  if(p.resources.salvage<project.salvageCost){showError(new Error("The colony needs "+project.salvageCost+" Salvage to commit to the Spring Water Line."));return}
  const next=structuredClone(gameState);
  next.playthrough.resources.salvage-=project.salvageCost;
  next.playthrough.projects[project.id]={started:true,complete:false,work:0,startedTurn:next.playthrough.turn};
  next.meta.updatedAt=new Date().toISOString();
  setBusy(true);
  try{await SaveManager.writeActiveSave(next);gameState=next;render();setSaveStatus("Spring project committed")}catch(error){showError(error)}finally{setBusy(false)}
}

async function researchEfficientSalvage(){
  if(!gameState)return;
  clearError();
  const research=RESEARCH.efficientSalvage,p=gameState.playthrough;
  if(p.research?.[research.id]?.complete)return;
  if(p.resources.salvage<research.salvageCost){showError(new Error("The colony needs "+research.salvageCost+" Salvage to research Efficient Salvage."));return}
  const next=structuredClone(gameState);
  next.playthrough.resources.salvage-=research.salvageCost;
  next.playthrough.research[research.id]={complete:true,completedTurn:next.playthrough.turn};
  next.meta.updatedAt=new Date().toISOString();
  setBusy(true);
  try{await SaveManager.writeActiveSave(next);gameState=next;render();setSaveStatus("Research completed")}catch(error){showError(error)}finally{setBusy(false)}
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
  ui.assignedValue.textContent=hasState?assigned+"/"+Object.keys(p.survivors).length:"—";
  ui.colonyStatus.textContent=hasState?"Fragile stability":"No active colony";
  ui.boardMessage.textContent=hasState?"The emergency systems work for now. Decide what the colony should make reliable first.":"Create or load a colony to reveal the first colony state.";
  ui.newGameButton.textContent=hasState?"Start New Colony":"Create New Colony";
  ui.statePanel.hidden=!hasState;
  ui.projectPanel.hidden=!hasState;
  ui.researchPanel.hidden=!hasState;ui.springProjectPanel.hidden=true;
  ui.eventPanel.hidden=true;ui.opportunityPanel.hidden=true;ui.surveyPanel.hidden=!hasState;ui.ridgeMarker.hidden=!hasState;
  ui.survivorCluster.replaceChildren();
  ui.survivorList.replaceChildren();
  if(hasState){
    if(p.projects?.[PROJECTS.springLine.id]?.complete){
      Object.keys(p.assignments).forEach(id=>{if(p.assignments[id]==="water")delete p.assignments[id]});
    }
    renderRegionalSurvey(gameState.scenario?.established?.regionalKnowledge);
    Object.values(p.survivors).forEach(s=>{
      const token=document.createElement("span");token.className="survivor-token";token.title=s.name;ui.survivorCluster.append(token);
      const card=document.createElement("div");card.className="survivor-card";const name=document.createElement("b"),role=document.createElement("small"),select=document.createElement("select");name.textContent=s.name;role.textContent=s.role;select.dataset.survivorId=s.id;select.setAttribute("aria-label","Assignment for "+s.name);WORK_OPTIONS.forEach(([id,label])=>{if(id==="investigate-ridge"&&gameState.scenario?.established?.regionalKnowledge?.northernRidge?.status!=="Surveyed")return;if(id==="survey-ridge"&&gameState.scenario?.established?.regionalKnowledge?.northernRidge?.status!=="Observed")return;if(id==="evaluate-spring"&&gameState.scenario?.established?.regionalKnowledge?.northernRidge?.status!=="Spring Confirmed")return;if(id==="build-spring-line"&&(!gameState.playthrough.projects?.[PROJECTS.springLine.id]?.started||gameState.playthrough.projects?.[PROJECTS.springLine.id]?.complete))return;if(id==="water"&&gameState.playthrough.projects?.[PROJECTS.springLine.id]?.complete)return;if(id.startsWith("assess-")&&!gameState.playthrough.projects?.[PROJECTS.springLine.id]?.complete)return;if(id==="assess-food"&&gameState.playthrough.flags?.opportunities?.food?.assessed)return;if(id==="assess-power"&&gameState.playthrough.flags?.opportunities?.power?.assessed)return;if(id==="assess-shelter"&&gameState.playthrough.flags?.opportunities?.shelter?.assessed)return;const option=document.createElement("option");option.value=id;option.textContent=label;select.append(option)});select.value=p.assignments[s.id]||"unassigned";select.addEventListener("change",changeAssignment);if(select.value!=="unassigned")card.classList.add("assigned");card.append(name,role,select);ui.survivorList.append(card)
    });
    const counts={shelter:0,salvage:0,forage:0,water:0,"survey-ridge":0,"investigate-ridge":0,"evaluate-spring":0,"build-spring-line":0,"assess-food":0,"assess-power":0,"assess-shelter":0};Object.values(p.assignments).forEach(id=>{if(id in counts)counts[id]++});
    ui.assignmentSummary.textContent=assigned+" of "+Object.keys(p.survivors).length+" assigned • Shelter "+counts.shelter+" • Salvage "+counts.salvage+" • Food "+counts.forage+" • Water "+counts.water+" • Ridge "+(counts["survey-ridge"]+counts["investigate-ridge"]+counts["evaluate-spring"])+" • Build "+counts["build-spring-line"]+" • Assess "+(counts["assess-food"]+counts["assess-power"]+counts["assess-shelter"]); renderPressures(p,counts);
    ui.commitTurnButton.disabled=false;
    const project=PROJECTS.waterCollector,built=Boolean(p.projects?.[project.id]?.complete),canBuild=p.resources.salvage>=project.salvageCost;
    ui.projectPanel.classList.toggle("complete",built);ui.collectorSite.hidden=!built;ui.buildProjectButton.hidden=built;ui.buildProjectButton.disabled=!canBuild;
    ui.projectStatus.textContent=built?"Built • +2 Water each turn":canBuild?"Ready to build":"Needs "+(project.salvageCost-p.resources.salvage)+" more Salvage";
    const spring=PROJECTS.springLine,springState=p.projects?.[spring.id],ridgeStatus=gameState.scenario?.established?.regionalKnowledge?.northernRidge?.status;
    if(ridgeStatus==="Spring Evaluated"){
      ui.springProjectPanel.hidden=false;
      ui.springProjectButton.hidden=Boolean(springState?.started);
      ui.springProjectButton.disabled=p.resources.salvage<spring.salvageCost;
      ui.springProjectStatus.textContent=springState?.complete?"Operational • routine water hauling eliminated":springState?.started?"Committed • "+(springState.work||0)+" / "+spring.workRequired+" construction work":p.resources.salvage>=spring.salvageCost?"Ready to commit":"Needs "+(spring.salvageCost-p.resources.salvage)+" more Salvage";
    }
    const research=RESEARCH.efficientSalvage,researched=Boolean(p.research?.[research.id]?.complete),canResearch=p.resources.salvage>=research.salvageCost;
    ui.researchPanel.classList.toggle("complete",researched);ui.researchButton.hidden=researched;ui.researchButton.disabled=!canResearch;
    ui.researchStatus.textContent=researched?"Researched • Salvage workers now recover 5":canResearch?"Ready to research":"Needs "+(research.salvageCost-p.resources.salvage)+" more Salvage";
    const opp=p.flags.opportunities||{},items=[];
    if(opp.food?.assessed)items.push("<b>Food</b> — "+opp.food.message);
    if(opp.power?.assessed)items.push("<b>Power</b> — "+opp.power.message);
    if(opp.shelter?.assessed)items.push("<b>Shelter</b> — "+opp.shelter.message);
    if(items.length){ui.opportunityList.innerHTML=items.map(x=>"<li>"+x+"</li>").join("");ui.opportunityPanel.hidden=false}
    const currentEvent=p.flags.lastTurn?.event;if(currentEvent?.id===EVENTS.shelterWear.id){ui.eventMessage.textContent="Turn "+p.flags.lastTurn.turn+": "+currentEvent.message;ui.eventPanel.hidden=false}
  }else{ui.commitTurnButton.disabled=true;ui.turnResult.hidden=true}
  if(hasState&&p.flags.lastTurn&&!ui.turnResult.textContent){const last=p.flags.lastTurn;ui.turnResult.textContent="Last resolved: Turn "+last.turn+" • Food "+signed(last.delta.food)+" • Water "+signed(last.delta.water)+" • Salvage "+signed(last.delta.salvage);ui.turnResult.hidden=false}
}

function renderRegionalSurvey(knowledge){
  const ridge=knowledge?.northernRidge||STARTING_REGIONAL_KNOWLEDGE.northernRidge;
  ui.surveyObservation.textContent=ridge.observation;
  ui.surveyInterpretation.textContent=ridge.observer+": "+ridge.interpretation;
  ui.ridgeMarker.querySelector("small").textContent=ridge.status+(ridge.status==="Surveyed"?" • damp ground":ridge.status==="Spring Confirmed"?" • water source":ridge.status==="Spring Evaluated"?" • viable source":" • dense vegetation");
}

function renderPressures(p,counts){
  const set=(id,status,detail)=>{const el=document.querySelector(id);if(!el)return;el.querySelector("b").textContent=status;el.querySelector("small").textContent=detail};
  const foodTurns=Math.floor(p.resources.food/Math.max(1,Object.keys(p.survivors).length));
  const springLineComplete=Boolean(p.projects?.[PROJECTS.springLine.id]?.complete);
  set("#pressureWater",springLineComplete?"Reliable supply":counts.water>0?"Labor committed":"Labor needed",springLineComplete?"Spring line supplies the colony • hauling labor freed":counts.water+" survivor"+(counts.water===1?"":"s")+" securing water this turn");
  set("#pressureFood",foodTurns<=2?"Short runway":"Finite runway","Stored food covers about "+foodTurns+" turn"+(foodTurns===1?"":"s")+" without foraging");
  set("#pressureShelter",counts.shelter>0?"Being maintained":"Improvised",counts.shelter>0?"Maintenance assigned this turn":"Protection works, but needs attention");
  const efficient=Boolean(p.research?.[RESEARCH.efficientSalvage.id]?.complete);
  set("#pressurePower",efficient?"Capability expanding":"Capability ceiling",efficient?"Improved methods are coming online":"Emergency power supports essentials only");
}

function setSaveStatus(text){ui.saveIndicator.textContent=text}
function setBusy(busy){
  ui.newGameButton.disabled=busy;ui.loadGameButton.disabled=busy;
  if(ui.commitTurnButton)ui.commitTurnButton.disabled=busy||!gameState;
  if(ui.buildProjectButton&&!ui.buildProjectButton.hidden){const p=gameState?.playthrough;ui.buildProjectButton.disabled=busy||!p||p.resources.salvage<PROJECTS.waterCollector.salvageCost}
  if(ui.springProjectButton&&!ui.springProjectButton.hidden){const p=gameState?.playthrough;ui.springProjectButton.disabled=busy||!p||p.resources.salvage<PROJECTS.springLine.salvageCost}
  if(ui.researchButton&&!ui.researchButton.hidden){const p=gameState?.playthrough;ui.researchButton.disabled=busy||!p||p.resources.salvage<RESEARCH.efficientSalvage.salvageCost}
}
function showError(error){console.error(error);ui.errorMessage.textContent=error instanceof Error?error.message:"An unexpected local-storage error occurred.";ui.errorMessage.hidden=false;setSaveStatus("Save unavailable")}
function clearError(){ui.errorMessage.hidden=true;ui.errorMessage.textContent=""}

async function initialize(){
  Object.assign(ui,{saveIndicator:document.querySelector("#saveIndicator"),turnValue:document.querySelector("#turnValue"),survivorValue:document.querySelector("#survivorValue"),foodValue:document.querySelector("#foodValue"),waterValue:document.querySelector("#waterValue"),salvageValue:document.querySelector("#salvageValue"),assignedValue:document.querySelector("#assignedValue"),colonyStatus:document.querySelector("#colonyStatus"),boardMessage:document.querySelector("#boardMessage"),newGameButton:document.querySelector("#newGameButton"),loadGameButton:document.querySelector("#loadGameButton"),errorMessage:document.querySelector("#errorMessage"),statePanel:document.querySelector("#statePanel"),survivorList:document.querySelector("#survivorList"),assignmentSummary:document.querySelector("#assignmentSummary"),commitTurnButton:document.querySelector("#commitTurnButton"),projectPanel:document.querySelector("#projectPanel"),buildProjectButton:document.querySelector("#buildProjectButton"),projectStatus:document.querySelector("#projectStatus"),researchPanel:document.querySelector("#researchPanel"),researchButton:document.querySelector("#researchButton"),researchStatus:document.querySelector("#researchStatus"),springProjectPanel:document.querySelector("#springProjectPanel"),springProjectButton:document.querySelector("#springProjectButton"),springProjectStatus:document.querySelector("#springProjectStatus"),eventPanel:document.querySelector("#eventPanel"),eventMessage:document.querySelector("#eventMessage"),turnResult:document.querySelector("#turnResult"),collectorSite:document.querySelector("#collectorSite"),survivorCluster:document.querySelector("#survivorCluster"),surveyPanel:document.querySelector("#surveyPanel"),surveyObservation:document.querySelector("#surveyObservation"),surveyInterpretation:document.querySelector("#surveyInterpretation"),ridgeMarker:document.querySelector("#ridgeMarker"),opportunityPanel:document.querySelector("#opportunityPanel"),opportunityList:document.querySelector("#opportunityList")});
  ui.newGameButton.addEventListener("click",createColony);ui.loadGameButton.addEventListener("click",loadColony);ui.commitTurnButton.addEventListener("click",commitTurn);ui.buildProjectButton.addEventListener("click",buildWaterCollector);ui.researchButton.addEventListener("click",researchEfficientSalvage);ui.springProjectButton.addEventListener("click",startSpringLine);
  try{await SaveManager.open();const existing=await SaveManager.readActiveSave();if(existing){if(validateGameState(existing).ok||existing.saveVersion===3||existing.saveVersion===4||existing.saveVersion===5||existing.saveVersion===6||existing.saveVersion===7||existing.saveVersion===8||existing.saveVersion===9){ui.loadGameButton.hidden=false;setSaveStatus(existing.saveVersion<SAVE_VERSION?"Phase 2 save ready to upgrade":"Local save found")}else if(existing.saveVersion< SAVE_VERSION){setSaveStatus("Phase 2 ready");showError(new Error("Your Phase 1 test colony is preserved, but Phase 2 uses a new colony format. Choose Start New Colony when you are ready to begin Phase 2."))}else{setSaveStatus("Save needs attention");showError(new Error(validateGameState(existing).message))}}else setSaveStatus("Ready for new colony")}catch(error){showError(error)}
  render();
  if("serviceWorker"in navigator)window.addEventListener("load",()=>{navigator.serviceWorker.register("./service-worker.js").catch(error=>console.error("Service worker registration failed:",error))})
}
document.addEventListener("DOMContentLoaded",initialize);