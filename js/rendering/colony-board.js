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
  let baseCalypsoScale=1,selected=false,time=0;

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
    calypso.on("pointertap",()=>selectCalypso());
    scene.addChild(calypso);

    shelter=new PIXI.Sprite(textures[ASSETS.shelter]);
    shelter.anchor.set(.5);
    shelter.eventMode="none";
    scene.addChild(shelter);

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
    shelter.scale.set(Math.max(.16,Math.min(.31,u*.25)));

    positionSurvivors(lastState);
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
    survivors.forEach(s=>s.visible=active);
    positionSurvivors(state);
    if(contextEl&&!active){
      contextEl.hidden=false;
      contextEl.innerHTML="<b>Crash Site</b><span>Create or load a colony to bring the physical site online.</span>";
    }else if(contextEl&&!selected){
      contextEl.hidden=false;
      contextEl.innerHTML="<b>Colony View</b><span>Tap the Calypso wreck to inspect the salvage site. Survivor positions respond to current work assignments.</span>";
    }
  }

  function selectCalypso(){
    if(!lastState)return;
    selected=!selected;
    calypso.tint=selected?0xffe3a1:0xffffff;
    if(contextEl){
      contextEl.hidden=false;
      contextEl.classList.toggle("selected",selected);
      contextEl.innerHTML=selected
        ?"<b>Calypso Wreck • Selected</b><span>The damaged ship remains the colony’s primary salvage source. Assign survivors to <strong>Salvage Wreck</strong> below to put activity at this site.</span>"
        :"<b>Colony View</b><span>Tap the Calypso wreck to inspect the salvage site. Survivor positions respond to current work assignments.</span>";
    }
  }

  function tick(ticker){
    if(!app||!lastState)return;
    time+=ticker.deltaTime/60;
    survivors.forEach((sprite,i)=>{
      if(!sprite.visible)return;
      sprite.rotation=Math.sin(time*1.25+i*.9)*.006;
    });
    if(selected){
      const pulse=1+Math.sin(time*3)*.018;
      calypso.scale.set(baseCalypsoScale*pulse);
    }else calypso.scale.set(baseCalypsoScale);
  }

  window.ColonyRenderer={init,renderState};
})();