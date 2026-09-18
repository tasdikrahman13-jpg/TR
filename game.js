// TASDIK OPEN WORLD V4 - original browser prototype
const $=id=>document.getElementById(id);
let scene,camera,renderer,clock=new THREE.Clock(),player,carObj,vehicleType="Sports Car";
let keys={},joy={x:0,y:0},running=false,inVehicle=false,health=100,stamina=100,money=500,xp=0,level=1,wanted=0;
let weather="clear",radio=false,missionIndex=0,jumping=false,customColor=0x4b65ff;
let npcs=[],traffic=[],police=[],buildings=[],markers=[],interior=false,insideName="";
const missions=[
 ["City Explorer","Reach the yellow marker.",50],
 ["Shop Visit","Visit the CITY SHOP.",75],
 ["Garage Trip","Visit the GARAGE and customize your vehicle.",100],
 ["Police Escape","Drive safely until the wanted meter returns to zero.",150],
 ["Final Delivery","Reach the final green marker.",300]
];
const saveKey="tasdikV4Save";

init();

function init(){
 scene=new THREE.Scene(); scene.fog=new THREE.Fog(0x9bb8cc,180,650);
 camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,1000);
 renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setSize(innerWidth,innerHeight); renderer.shadowMap.enabled=true; renderer.setPixelRatio(Math.min(devicePixelRatio,1.7)); document.body.appendChild(renderer.domElement);
 clock.start();
 scene.add(new THREE.HemisphereLight(0xbde8ff,0x243020,2.0));
 const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(100,180,70);sun.castShadow=true;scene.add(sun);
 makeWorld(); makePlayer(); makeVehicle(); makeTraffic(); makeNPCs(); makePolice(); makeMissions(); loadGame(); bind();
 $("loadbar").style.width="100%";setTimeout(()=>$("loading").remove(),500); toast("Welcome to Tasdik City!");
 animate();
}

function mat(c){return new THREE.MeshStandardMaterial({color:c,roughness:.8})}
function box(w,h,d,c){let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.castShadow=m.receiveShadow=true;return m}
function makeWorld(){
 scene.background=new THREE.Color(0x86b8df);
 const ground=box(1000,1,1000,0x41613e);ground.position.y=-.5;scene.add(ground);
 for(let i=-500;i<=500;i+=50){let r=box(16,.12,1000,0x33383c);r.position.set(i,0,0);scene.add(r);let r2=box(1000,.12,16,0x33383c);r2.position.set(0,.01,i);scene.add(r2)}
 for(let i=-500;i<=500;i+=50)for(let z=-500;z<=500;z+=50){
   if(Math.random()<.72){let h=8+Math.random()*34,b=box(26,h,26,0x56616b);b.position.set(i+Math.random()*15-7,h/2,z+Math.random()*15-7);scene.add(b);buildings.push(b);
   for(let y=5;y<h;y+=6){let w=box(2,.9,.12,0xffdf7a);w.position.set(b.position.x-5,y,b.position.z-13.1);scene.add(w)}}
 }
 addSpecial(-70,0,-70,"SHOP"); addSpecial(70,0,-70,"GARAGE"); addSpecial(0,0,110,"HANGAR");
 for(let i=0;i<120;i++){let t=new THREE.Group();let trunk=box(1,5,1,0x67452d);trunk.position.y=2.5;t.add(trunk);let crown=new THREE.Mesh(new THREE.SphereGeometry(4,8,8),mat(0x2e7d32));crown.position.y=7;crown.castShadow=true;t.add(crown);t.position.set((Math.random()-.5)*850,0,(Math.random()-.5)*850);scene.add(t)}
}
function addSpecial(x,y,z,name){let b=box(30,18,30,name==="HANGAR"?0x596b78:0x704b8e);b.position.set(x,9,z);scene.add(b);let s=new THREE.Sprite(new THREE.SpriteMaterial({map:texture(name),transparent:true}));s.scale.set(22,5,1);s.position.set(x,22,z);scene.add(s);buildings.push(b)}
function texture(txt){let c=document.createElement("canvas");c.width=512;c.height=128;let x=c.getContext("2d");x.fillStyle="#000b";x.fillRect(0,0,512,128);x.fillStyle="#fff";x.font="bold 55px Arial";x.textAlign="center";x.fillText(txt,256,82);return new THREE.CanvasTexture(c)}

function makePlayer(){player=new THREE.Group();let body=box(2.4,3.5,1.5,customColor);body.position.y=2.1;player.add(body);let head=new THREE.Mesh(new THREE.SphereGeometry(1.05,16,12),mat(0xd69b76));head.position.y=4.5;head.castShadow=true;player.add(head);player.position.set(0,0,0);scene.add(player)}
function makeVehicle(){carObj=buildVehicle(0x4b65ff,"Sports Car");carObj.position.set(8,0,8);scene.add(carObj)}
function buildVehicle(color,name,mode="car"){let g=new THREE.Group();g.userData={name,mode,speed:0,heading:0};let base=box(mode==="air"?5:5,1.1,mode==="air"?9:8,color);base.position.y=1.2;g.add(base);if(mode==="car"||mode==="boat"){for(let s of [-1,1])for(let z of [-2.5,2.5]){let w=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.5,16),mat(0x151515));w.rotation.z=Math.PI/2;w.position.set(s*2.5,.75,z);g.add(w)}}if(mode==="air"){let wing=box(13,.25,1.2,0xdddddd);wing.position.y=1.4;g.add(wing);let tail=box(1,.3,3,0xdddddd);tail.position.set(0,2,-3);g.add(tail)}if(mode==="boat"){let hull=box(4,1,9,0x263238);hull.position.y=.5;g.add(hull)}return g}
function makeTraffic(){for(let i=0;i<22;i++){let v=buildVehicle([0xd32f2f,0xffc107,0x43a047,0xffffff][i%4],"Traffic");v.position.set((Math.random()-.5)*700,0,(Math.random()-.5)*700);v.userData.axis=i%2?"x":"z";v.userData.dir=i%2?1:-1;scene.add(v);traffic.push(v)}}
function makeNPCs(){for(let i=0;i<40;i++){let n=new THREE.Group(),b=box(1.1,2.2,1,Math.random()*0xffffff);b.position.y=1.1;n.add(b);n.position.set((Math.random()-.5)*650,0,(Math.random()-.5)*650);n.userData={a:Math.random()*6.28,r:.5+Math.random()*1};scene.add(n);npcs.push(n)}}
function makePolice(){for(let i=0;i<4;i++){let p=buildVehicle(0x111111,"Police");p.visible=false;scene.add(p);police.push(p)}}
function marker(color){let m=new THREE.Mesh(new THREE.TorusGeometry(4,.35,10,32),new THREE.MeshBasicMaterial({color}));m.rotation.x=Math.PI/2;scene.add(m);return m}
function makeMissions(){for(let i=0;i<missions.length;i++){let m=marker(i===4?0x39ff75:0xffdd22);m.position.set([-100, -70,70,160,220][i],.3,[-100,-70,-70,120,220][i]);markers.push(m)}updateMission()}

function updateMission(){let q=missions[missionIndex];$("missionTitle").textContent=q[0];$("missionText").textContent=q[1];$("missionReward").textContent="Reward ₹"+q[2]}
function completeMission(){let q=missions[missionIndex];money+=q[2];xp+=50;if(xp>=100){level++;xp-=100}toast("Mission complete! +₹"+q[2]);missionIndex=Math.min(missionIndex+1,missions.length-1);updateMission();saveGame()}
function distanceTo(v){return player.position.distanceTo(v.position)}

function bind(){
 addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==="e")interact();if(e.key.toLowerCase()==="p")togglePhone();if(e.key.toLowerCase()==="m")togglePanel("menu")});
 addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
 $("jump").onpointerdown=()=>jump();$("run").onpointerdown=()=>running=true;$("run").onpointerup=()=>running=false;$("car").onpointerdown=interact;$("interact").onpointerdown=interact;$("phoneBtn").onpointerdown=togglePhone;
 document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>action(b.dataset.action));
 let joyEl=$("joy"),stick=$("stick");function setJoy(e){let r=joyEl.getBoundingClientRect(),x=e.clientX-r.left-62.5,y=e.clientY-r.top-62.5,d=Math.min(45,Math.hypot(x,y)),a=Math.atan2(y,x);joy.x=Math.cos(a)*d/45;joy.y=Math.sin(a)*d/45;stick.style.transform=`translate(${joy.x*40}px,${joy.y*40}px)`}
 joyEl.onpointerdown=e=>{joyEl.setPointerCapture(e.pointerId);setJoy(e)};joyEl.onpointermove=e=>{if(e.buttons)setJoy(e)};joyEl.onpointerup=()=>{joy.x=joy.y=0;stick.style.transform=""};
 addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)})
}
function action(a){if(a==="close"){$("panel").classList.add("hidden");$("menu").classList.add("hidden");return}if(a==="map")showMap();if(a==="missions")showMissions();if(a==="weather")cycleWeather();if(a==="radio")toggleRadio();if(a==="save"){saveGame();toast("Game saved")}if(a==="customize")customize();if(a==="inventory")inventory();if(a==="garage")garage()}
function togglePhone(){$("phone").classList.toggle("hidden")}
function togglePanel(id){$(id).classList.toggle("hidden")}
function showMap(){$("panel").classList.remove("hidden");$("panel").innerHTML="<h2>🗺 CITY MAP</h2><p>Yellow = mission • Purple = shop/garage • Green = final mission</p><p>City size: 1000 × 1000</p><button data-action='close'>Close</button>";$("panel").querySelector("button").onclick=()=>action("close")}
function showMissions(){$("panel").classList.remove("hidden");$("panel").innerHTML="<h2>📋 MISSIONS</h2>"+missions.map((m,i)=>`<p>${i+1}. ${m[0]} — ₹${m[2]} ${i<missionIndex?"✓":i===missionIndex?"▶":"🔒"}</p>`).join("")+"<button data-action='close'>Close</button>";$("panel").querySelector("button").onclick=()=>action("close")}
function customize(){$("panel").classList.remove("hidden");$("panel").innerHTML="<h2>👕 Character Customization</h2><p>Choose your outfit color:</p><button onclick='setColor(0x4b65ff)'>Blue</button><button onclick='setColor(0xff3d71)'>Pink</button><button onclick='setColor(0x24d17e)'>Green</button><button onclick='setColor(0xffc107)'>Yellow</button><button data-action='close'>Close</button>";$("panel").querySelector("[data-action]").onclick=()=>action("close")}
window.setColor=c=>{customColor=c;player.children[0].material.color.setHex(c);toast("Outfit updated")}
function inventory(){$("panel").classList.remove("hidden");$("panel").innerHTML=`<h2>🎒 Inventory</h2><p>🍔 Food: ${localStorage.food||0}</p><p>⛽ Fuel cans: ${localStorage.fuel||0}</p><p>🪙 Money: ₹${money}</p><button data-action="close">Close</button>`;$("panel").querySelector("button").onclick=()=>action("close")}
function garage(){$("panel").classList.remove("hidden");$("panel").innerHTML="<h2>🚗 Garage</h2><button onclick='changeVehicle(\"Sports Car\",0x4b65ff,\"car\")'>Sports Car</button><button onclick='changeVehicle(\"Taxi\",0xffc107,\"car\")'>Taxi</button><button onclick='changeVehicle(\"Boat\",0x1565c0,\"boat\")'>Boat</button><button onclick='changeVehicle(\"Helicopter\",0x777777,\"air\")'>Helicopter</button><button onclick='changeVehicle(\"Airplane\",0xeceff1,\"air\")'>Airplane</button><button data-action='close'>Close</button>";$("panel").querySelector("[data-action]").onclick=()=>action("close")}
window.changeVehicle=(name,color,mode)=>{let pos=carObj.position.clone();scene.remove(carObj);carObj=buildVehicle(color,name,mode);carObj.position.copy(pos);scene.add(carObj);vehicleType=name;toast(name+" selected");garage()}
function interact(){if(inVehicle){inVehicle=false;player.visible=true;player.position.copy(carObj.position).add(new THREE.Vector3(3,0,0));return}if(player.position.distanceTo(carObj.position)<8){inVehicle=true;player.visible=false;toast("Driving "+vehicleType);return}if(player.position.distanceTo(new THREE.Vector3(-70,0,-70))<25){shop()}else if(player.position.distanceTo(new THREE.Vector3(70,0,-70))<25){garage()}}
function shop(){$("panel").classList.remove("hidden");$("panel").innerHTML="<h2>🏪 CITY SHOP</h2><p>Food restores stamina.</p><button onclick='buyFood()'>Food ₹50</button><button onclick='buyFuel()'>Fuel ₹100</button><button data-action='close'>Close</button>";$("panel").querySelector("[data-action]").onclick=()=>action("close")}
window.buyFood=()=>{if(money>=50){money-=50;localStorage.food=(+localStorage.food||0)+1;toast("Food added")}else toast("Not enough money")}
window.buyFuel=()=>{if(money>=100){money-=100;localStorage.fuel=(+localStorage.fuel||0)+1;toast("Fuel added")}else toast("Not enough money")}
function jump(){if(jumping||inVehicle)return;jumping=true;let t=0;let f=()=>{t+=.12;player.position.y=Math.sin(t)*4;if(t<Math.PI){requestAnimationFrame(f)}else{player.position.y=0;jumping=false}};f()}
function cycleWeather(){weather=weather==="clear"?"rain":weather==="rain"?"fog":"clear";if(weather==="rain"){scene.fog=new THREE.Fog(0x71808a,80,350);scene.background.set(0x66727a);toast("Rainy weather")}else if(weather==="fog"){scene.fog=new THREE.Fog(0xaaaaaa,30,150);scene.background.set(0x9b9b9b);toast("Foggy weather")}else{scene.fog=new THREE.Fog(0x9bb8cc,180,650);scene.background.set(0x86b8df);toast("Clear weather")}}
let audioCtx;function toggleRadio(){radio=!radio;if(radio){audioCtx=audioCtx||new (AudioContext||webkitAudioContext)();let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=440;g.gain.value=.025;o.connect(g).connect(audioCtx.destination);o.start();setTimeout(()=>o.stop(),250);toast("Radio ON (original tone)")}else toast("Radio OFF")}
function updatePlayer(dt){
 let sx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+joy.x,sy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+joy.y;let len=Math.hypot(sx,sy);if(len>1){sx/=len;sy/=len}
 if(inVehicle){let mode=carObj.userData.mode;if(mode==="air"){carObj.position.y+=(-sy)*dt*12}else{carObj.position.x+=sx*dt*22;carObj.position.z+=-sy*dt*22}carObj.rotation.y=Math.atan2(sx,-sy);let sp=Math.min(180,Math.round(Math.hypot(sx,sy)*65));$("speed").textContent=sp+" km/h";if(sp>80)wanted=Math.min(5,wanted+dt*.025);player.position.copy(carObj.position)}else{let sp=running&&stamina>1?dt*14:dt*8;player.position.x+=sx*sp;player.position.z+=sy*sp;stamina+=running?-dt*18:dt*10;stamina=Math.max(0,Math.min(100,stamina));if(len>.1)player.rotation.y=Math.atan2(sx,sy);$("speed").textContent="0 km/h"}}
function updateAI(dt){for(let n of npcs){n.userData.a+=dt*(Math.random()-.5)*.25;n.position.x+=Math.cos(n.userData.a)*dt*1.4;n.position.z+=Math.sin(n.userData.a)*dt*1.4}
 for(let t of traffic){if(t.userData.axis==="x")t.position.x+=t.userData.dir*dt*13;else t.position.z+=t.userData.dir*dt*13;if(Math.abs(t.position.x)>500)t.position.x=-t.position.x;if(Math.abs(t.position.z)>500)t.position.z=-t.position.z}
 let active=wanted>.15;police.forEach((p,i)=>{p.visible=active;if(active){let a=(i/4)*Math.PI*2;p.position.lerp(new THREE.Vector3(player.position.x+Math.cos(a)*18,0,player.position.z+Math.sin(a)*18),Math.min(1,dt*.7));if(p.position.distanceTo(player.position)<7){health=Math.max(0,health-dt*5);wanted=Math.max(0,wanted-dt*.15)}}});wanted=Math.max(0,wanted-dt*.03)}
function checkMission(){let m=markers[missionIndex];if(!m)return;m.visible=true;if(player.position.distanceTo(m.position)<9){if(missionIndex===3&&wanted>0.1)return;completeMission()}}
function hud(){ $("health").textContent=Math.round(health);$("stamina").textContent=Math.round(stamina);$("wanted").textContent=Math.round(wanted);$("money").textContent=money;$("level").textContent="Lv "+level;$("xp").textContent=`XP ${Math.round(xp)}/100`;$("vehicle").textContent=inVehicle?vehicleType:"On foot";let c=$("mini").getContext("2d");c.clearRect(0,0,150,150);c.strokeStyle="#777";for(let i=0;i<10;i++){c.strokeRect(i*15,0,1,150);c.strokeRect(0,i*15,150,1)}c.fillStyle="#39ff75";c.fillRect(73,73,5,5)}
function saveGame(){localStorage.setItem(saveKey,JSON.stringify({money,xp,level,wanted,missionIndex,health,weather,customColor,vehicleType,food:+localStorage.food||0,fuel:+localStorage.fuel||0}))}
function loadGame(){try{let s=JSON.parse(localStorage.getItem(saveKey)||"null");if(s){Object.assign(window,s);localStorage.food=s.food||0;localStorage.fuel=s.fuel||0;if(customColor){player.children[0].material.color.setHex(customColor)}updateMission();cycleWeather();if(s.weather==="clear")cycleWeather()}}catch(e){}}
function toast(t){let e=$("toast");e.textContent=t;e.style.opacity=1;clearTimeout(window.tt);window.tt=setTimeout(()=>e.style.opacity=0,1800)}
function animate(){requestAnimationFrame(animate);let dt=Math.min(.05,clock.getDelta());updatePlayer(dt);updateAI(dt);checkMission();hud();let target=(inVehicle?carObj:player).position.clone();target.y+=4;let off=new THREE.Vector3(0,8,14).applyAxisAngle(new THREE.Vector3(0,1,0),(inVehicle?carObj.rotation.y:player.rotation.y));camera.position.lerp(target.clone().add(off),.08);camera.lookAt(target);renderer.render(scene,camera)}
setInterval(saveGame,10000);
