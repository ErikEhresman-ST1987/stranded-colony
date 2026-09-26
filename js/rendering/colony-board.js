"use strict";

(() => {
  const DESIGN_W=1536, DESIGN_H=1024;
  const ASSETS={
    background:"./assets/backgrounds/temperate-frontier-crash-site.webp",
    calypso:"./assets/calypso-wreck-test.webp",
    shelter:"./assets/emergency-shelter.PNG",
    survivor:"./assets/survivors/survivor-field-suit.webp"
  };
  let app=null,host=null,scene=null,background=null,calypso=null,shelter=null,survivors=[],contextEl=null,resizeObserver=null,lastState=null;
  let waterCollector=null,springLine=null,selectedObject=null,time=0;
  let baseCalypsoScale=1,baseShelterScale=1;

  async function init(target,contextTarget){
    host=target;contextEl=contextTarget;
    if(!host||!window.PIXI)throw new Error("PixiJS colony renderer could not start.");
    app=new PIXI.Application();
    await app.init({resizeTo:host,backgroundAlpha:0,antialias:true,autoDensity:true,resolution:Math.min(window.devicePixelRatio||1,2),preference:"webgl"});
    app.canvas.className="pixi-colony-canvas";
    app.canvas.setAttribute("aria-label","Interactive view of the stranded colony");
    app.canvas.setAttribute("role","img");
    host.appendChild(app.canvas);

    const textures=await PIXI.Assets.load([ASSETS.background,ASSETS.calypso,ASSETS.shelter,ASSETS.survivor]);
    scene=new PIXI.Container();
    app.stage.addChild(scene);

    background=new PIXI.Sprite(textures[ASSETS.background]);
    background.eventMode="none";
    scene.addChild(background);

    calypso=new PIXI.Sprite(textures[ASSETS.calypso]);
    calypso.anchor.set(.5);
    calypso.eventMode="static";
    calypso.cursor="pointer";
    calypso.on("pointertap",()=>selectWorldObject("calypso"));
    scene.addChild(calypso);

    shelter=new PIXI.Sprite(textures[ASSETS.shelter]);
    shelter.anchor.set(.5);
    shelter.eventMode="static";
    shelter.cursor="pointer";
    shelter.on("pointertap",()=>selectWorldObject("shelter"));
    scene.addChild(shelter);

    waterCollector=new PIXI.Container();
    waterCollector.eventMode="static";
    waterCollector.cursor="pointer";
    waterCollector.on("pointertap",()=>selectWorldObject("collector"));
    const collectorTank=new PIXI.Graphics().roundRect(-18,-28,36,50,8).fill({color:0xaeb9ad}).stroke({width:3,color:0x56645c});
    const collectorCap=new PIXI.Graphics().roundRect(-14,-34,28,9,4).fill({color:0x778980});
    const collectorDrop=new PIXI.Graphics().circle(0,-5,5).fill({color:0x6ea9ad});
    waterCollector.addChild(collectorTank,collectorCap,collectorDrop);
    scene.addChild(waterCollector);

    springLine=new PIXI.Container();
    springLine.eventMode="static";
    springLine.cursor="pointer";
    springLine.on("pointertap",()=>selectWorldObject("spring"));
    scene.addChild(springLine);

    for(let i=0;i<6;i++){
      const sprite=new PIXI.Sprite(textures[ASSETS.survivor]);
      sprite.anchor.set(.5,1);
      sprite.eventMode="none";
      scene.addChild(sprite);
      survivors.push(sprite);
    }

    resizeObserver=new ResizeObserver(()=>layout());
    resizeObserver.observe(host);
    app.ticker.add(tick);
    layout();
    renderState(null);
  }

  function layout(){
    if(!app||!background)return;
    const w=app.screen.width,h=app.screen.height;
    if(!w||!h)return;
    const cover=Math.max(w/DESIGN_W,h/DESIGN_H);
    background.width=DESIGN_W*cover;background.height=DESIGN_H*cover;
    background.x=(w-background.width)/2;background.y=(h-background.height)/2;

    const u=Math.min(w/900,h/560);
    calypso.x=w*.34;calypso.y=h*.59;
    baseCalypsoScale=Math.max(.19,Math.min(.38,u*.31));
    calypso.scale.set(baseCalypsoScale);

    shelter.x=w*.74;shelter.y=h*.59;
    baseShelterScale=Math.max(.16,Math.min(.31,u*.25));
    shelter.scale.set(baseShelterScale);

    waterCollector.x=w*.82;waterCollector.y=h*.65;
    waterCollector.scale.set(Math.max(.72,Math.min(1.15,u*.95)));

    drawSpringLine(w,h);
    positionSurvivors(lastState);
  }

  function drawSpringLine(w,h){
    if(!springLine)return;
    springLine.removeChildren();
    const points=[w*.12,h*.34,w*.29,h*.42,w*.48,h*.51,w*.68,h*.59,w*.79,h*.64];
    const pipe=new PIXI.Graphics().moveTo(points[0],points[1]);
    for(let i=2;i<points.length;i+=2)pipe.lineTo(points[i],points[i+1]);
    pipe.stroke({width:Math.max(4,w*.006),color:0xb8a878,alpha:.95});
    const source=new PIXI.Graphics().circle(points[0],points[1],Math.max(7,w*.009)).fill({color:0x75aeb0,alpha:.9}).stroke({width:2,color:0xd7ebe6});
    const tank=new PIXI.Graphics().roundRect(points[8]-15,points[9]-25,30,42,7).fill({color:0xaab4aa}).stroke({width:3,color:0x53635b});
    springLine.addChild(pipe,source,tank);
  }

  function positionSurvivors(state){
    if(!app)return;
    const w=app.screen.width,h=app.screen.height,u=Math.min(w/900,h/560);
    const people=state?.playthrough?.survivors?Object.values(state.playthrough.survivors):[];
    survivors.forEach((sprite,i)=>{
      const person=people[i];
      sprite.visible=Boolean(person);
      if(!person)return;
      const work=state.playthrough.assignments?.[person.id]||"unassigned";
      let x=.58+(i%3)*.055,y=.69+Math.floor(i/3)*.075;
      if(work==="salvage"){x=.39+(i%2)*.045;y=.70+(i%3)*.025}
      else if(work==="shelter"){x=.70+(i%2)*.045;y=.70+(i%3)*.025}
      else if(work==="forage"){x=.84+(i%2)*.035;y=.77+(i%3)*.02}
      else if(work==="water"||work.includes("ridge")||work==="evaluate-spring"){x=.17+(i%2)*.04;y=.55+(i%3)*.025}
      else if(work==="build-spring-line"){x=.57+(i%2)*.045;y=.62+(i%3)*.02}
      else if(work.startsWith("assess-")){x=.61+(i%3)*.05;y=.69+(i%2)*.055}
      sprite.x=w*x;sprite.y=h*y;
      sprite.scale.set(Math.max(.045,Math.min(.075,u*.064)));
      sprite.alpha=work==="unassigned"?.86:1;
    });
  }

  function renderState(state){
    lastState=state;
    if(!app)return;
    const active=Boolean(state?.playthrough);
    calypso.visible=active;shelter.visible=active;
    const collectorBuilt=Boolean(state?.playthrough?.projects?.["water-collector"]?.complete);
    const springComplete=Boolean(state?.playthrough?.projects?.["spring-line"]?.complete);
    waterCollector.visible=active&&collectorBuilt;
    springLine.visible=active&&springComplete;
    survivors.forEach(s=>s.visible=active);
    positionSurvivors(state);
    if(contextEl&&!active){
      contextEl.hidden=false;
      contextEl.innerHTML="<b>Crash Site</b><span>Create or load a colony to bring the physical site online.</span>";
    }else if(contextEl&&!selectedObject){
      contextEl.hidden=false;
      contextEl.innerHTML="<b>Colony View</b><span>Tap Calypso, the shelter, or built infrastructure to inspect the physical colony. Survivor positions respond to current work assignments.</span>";
    }
    updateSelection();
  }

  function selectWorldObject(id){
    if(!lastState)return;
    selectedObject=selectedObject===id?null:id;
    updateSelection();
  }

  function updateSelection(){
    calypso.tint=selectedObject==="calypso"?0xffe3a1:0xffffff;
    shelter.tint=selectedObject==="shelter"?0xffe3a1:0xffffff;
    waterCollector.alpha=selectedObject==="collector"?1:.92;
    springLine.alpha=selectedObject==="spring"?1:.88;
    if(!contextEl)return;
    contextEl.classList.toggle("selected",Boolean(selectedObject));
    const copy={
      calypso:["Calypso Wreck • Selected","The damaged ship remains the colony’s primary salvage source. Assign survivors to <strong>Salvage Wreck</strong> below to put activity at this site."],
      shelter:["Emergency Shelter • Selected","The shelter protects the colony and provides its first dependable working space. Survivors assigned to <strong>Maintain Shelter</strong> appear here."],
      collector:["Water Collector • Selected","This built improvement adds <strong>+2 Water each turn</strong>. It appears here because the current colony save says the project is complete."],
      spring:["Spring Water Line • Selected","The completed gravity-fed line makes water a <strong>reliable supply</strong> and frees the colony from routine hauling labor."]
    };
    const item=copy[selectedObject];
    contextEl.innerHTML=item?"<b>"+item[0]+"</b><span>"+item[1]+"</span>":"<b>Colony View</b><span>Tap Calypso, the shelter, or built infrastructure to inspect the physical colony.</span>";
  }

  function tick(ticker){
    if(!app||!lastState)return;
    time+=ticker.deltaTime/60;
    survivors.forEach((sprite,i)=>{
      if(!sprite.visible)return;
      sprite.rotation=Math.sin(time*1.25+i*.9)*.006;
    });
    const pulse=1+Math.sin(time*3)*.018;
    calypso.scale.set(baseCalypsoScale*(selectedObject==="calypso"?pulse:1));
    shelter.scale.set(baseShelterScale*(selectedObject==="shelter"?pulse:1));
    if(waterCollector?.visible&&selectedObject==="collector")waterCollector.scale.set(waterCollector.scale.x*(1+Math.sin(time*3)*.0015));
  }

  window.ColonyRenderer={init,renderState};
})();