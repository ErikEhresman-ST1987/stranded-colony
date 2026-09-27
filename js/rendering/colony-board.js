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
  let waterCollector=null,springLine=null,foodTrial=null,auxPower=null,ridgeHotspot=null,selectedObject=null,time=0;
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

    ridgeHotspot=new PIXI.Container();ridgeHotspot.eventMode="static";ridgeHotspot.cursor="pointer";ridgeHotspot.on("pointertap",()=>selectWorldObject("ridge"));
    const ridgeRing=new PIXI.Graphics().circle(0,0,18).fill({color:0x87b9a7,alpha:.12}).stroke({width:3,color:0xd9eee4,alpha:.75});
    ridgeHotspot.addChild(ridgeRing);scene.addChild(ridgeHotspot);

    foodTrial=new PIXI.Container();
    foodTrial.eventMode="static";
    foodTrial.cursor="pointer";
    foodTrial.on("pointertap",()=>selectWorldObject("food"));
    const soil=new PIXI.Graphics().roundRect(-44,-18,88,36,9).fill({color:0x725a3f,alpha:.95}).stroke({width:2,color:0x4f4738});
    foodTrial.addChild(soil);
    [-27,-9,9,27].forEach(x=>{const plant=new PIXI.Graphics().moveTo(x,8).lineTo(x,-5).stroke({width:3,color:0x416f43}).circle(x-4,-8,5).fill({color:0x6f9a55}).circle(x+4,-10,5).fill({color:0x829f5d});foodTrial.addChild(plant)});
    scene.addChild(foodTrial);

    auxPower=new PIXI.Container();
    auxPower.eventMode="static";auxPower.cursor="pointer";auxPower.on("pointertap",()=>selectWorldObject("power"));
    const powerBody=new PIXI.Graphics().roundRect(-38,-24,76,48,8).fill({color:0x626c68}).stroke({width:3,color:0x303b38});
    const powerPanel=new PIXI.Graphics().roundRect(-25,-15,50,30,5).fill({color:0x394641}).stroke({width:2,color:0x8a9b91});
    const powerGlow=new PIXI.Graphics().circle(17,0,5).fill({color:0x8fd1c8});
    const powerFeet=new PIXI.Graphics().rect(-31,23,12,8).fill({color:0x414b47}).rect(19,23,12,8).fill({color:0x414b47});
    auxPower.addChild(powerBody,powerPanel,powerGlow,powerFeet);scene.addChild(auxPower);

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
    ridgeHotspot.x=w*.15;ridgeHotspot.y=h*.32;ridgeHotspot.scale.set(Math.max(.7,Math.min(1.1,u)));
    foodTrial.x=w*.88;foodTrial.y=h*.78;foodTrial.scale.set(Math.max(.7,Math.min(1.2,u)));
    auxPower.x=w*.61;auxPower.y=h*.64;auxPower.scale.set(Math.max(.65,Math.min(1.05,u*.9)));
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
      else if(work==="build-food-trial"){x=.84+(i%2)*.04;y=.76+(i%3)*.025}
      else if(work==="recover-aux-power"){x=.55+(i%2)*.045;y=.67+(i%3)*.025}
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
    ridgeHotspot.visible=active;
    foodTrial.visible=active&&Boolean(state?.playthrough?.projects?.["food-trial"]?.complete);
    auxPower.visible=active&&Boolean(state?.playthrough?.projects?.["aux-power"]?.complete);
    survivors.forEach(s=>s.visible=active);
    positionSurvivors(state);
    if(contextEl)contextEl.hidden=false;
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
    ridgeHotspot.alpha=selectedObject==="ridge"?1:.62;
    foodTrial.alpha=selectedObject==="food"?1:.92;
    auxPower.alpha=selectedObject==="power"?1:.9;
    window.dispatchEvent(new CustomEvent("colony-world-select",{detail:{id:selectedObject}}));
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

  function select(id){selectedObject=id;updateSelection()}
  function getSelected(){return selectedObject}
  window.ColonyRenderer={init,renderState,select,getSelected};
})();