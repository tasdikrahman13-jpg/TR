const $=id=>document.getElementById(id);
let scene,camera,renderer,clock=new THREE.Clock(),player,car,inCar=false;
let keys={},joy={x:0,y:0},running=false,jumping=false;
let hp=100,stamina=100,wanted=0,money=500,xp=0,level=1,mission=0,weather="clear";
let people=[],traffic=[],police=[],markers=[],buildings=[];
const MISSION=[
["CITY EXPLORER","Reach the yellow marker.",50],
["SHOP RUN","Visit the city shop.",75],
["FIRST RIDE","Enter the sports car.",100],
["GARAGE","Reach the garage.",120],
["ESCAPE","Lose the wanted level.",160],
["FINAL DELIVERY","Reach the green marker.",300]
];

init();
function init(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x86b9df);scene.fog=new THREE.Fog(0x9fb8c5,260,1100);
 camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,1800);
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;document.body.appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xcfeeff,0x2d412e,1.8));
 let sun=new THREE.DirectionalLight(0xffffff,2.6);sun.position.set(180,250,120);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-700;sun.shadow.camera.right=700;sun.shadow.camera.top=700;sun.shadow.camera.bottom=-700;scene.add(sun);
 buildWorld();makePlayer();makeCar();makeTraffic();makePeople();makePolice();makeMarkers();controls();loadGame();
 let p=0,iv=setInterval(()=>{p+=12;$("load").style.width=Math.min(100,p)+"%";if(p>=100){clearInterval(iv);setTimeout(()=>$("loading").remove(),250)}},90);
 updateMission();animate();
}
function mat(c,r=.78,m=0){return new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m})}
function box(w,h,d,c,r=.78,m=0){let q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c,r,m));q.castShadow=true;q.receiveShadow=true;return q}
function buildWorld(){
 let ground=box(1800,1,1800,0x466c4b);ground.position.y=-.5;scene.add(ground);
 // City grid and sidewalks
 for(let p=-825;p<=825;p+=75){
  let road=box(23,.1,1650,0x292d30);road.position.set(p,.02,0);scene.add(road);
  let road2=box(1650,.1,23,0x292d30);road2.position.set(0,.025,p);scene.add(road2);
  for(let z=-790;z<790;z+=24){let line=box(.35,.11,10,0xd6cda2);line.position.set(p,z,.1);scene.add(line)}
  for(let x=-790;x<790;x+=24){let line=box(10,.11,.35,0xd6cda2);line.position.set(x,p,.1);scene.add(line)}
 }
 for(let x=-825;x<=825;x+=75)for(let z=-825;z<=825;z+=75){
  if(Math.random()<.74){
   let w=38+Math.random()*24,d=38+Math.random()*24,h=12+Math.random()*72;
   let colors=[0x8e8277,0x65737d,0x786d65,0x56636d,0xa69b89,0x6c655d];
   let b=box(w,h,d,colors[Math.floor(Math.random()*colors.length)]);b.position.set(x+(Math.random()-.5)*18,h/2,z+(Math.random()-.5)*18);scene.add(b);buildings.push(b);
   let roof=box(w+1,.8,d+1,0x34393d);roof.position.set(b.position.x,h+.4,b.position.z);scene.add(roof);
   for(let y=6;y<h-4;y+=7)for(let s=-1;s<=1;s+=2){let win=box(Math.max(4,w*.58),1,.14,0xe3ce72,.3);win.position.set(b.position.x,y,b.position.z+s*(d/2+.1));scene.add(win)}
  }
 }
 special(-225,-225,"SHOP",0x704a8c);special(225,-225,"GARAGE",0x315f8c);special(0,300,"HANGAR",0x5b6870);
 for(let i=0;i<240;i++)makeTree((Math.random()-.5)*1650,(Math.random()-.5)*1650);
}
function special(x,z,name,color){let b=box(56,23,56,color,.7);b.position.set(x,11.5,z);scene.add(b);let s=new THREE.Sprite(new THREE.SpriteMaterial({map=textTexture(name),transparent:true}));s.scale.set(34,7,1);s.position.set(x,28,z);scene.add(s)}
function textTexture(t){let c=document.createElement("canvas");c.width=512;c.height=128;let x=c.getContext("2d");x.fillStyle="#000d";x.fillRect(0,0,512,128);x.fillStyle="#fff";x.font="bold 58px Arial";x.textAlign="center";x.fillText(t,256,82);return new THREE.CanvasTexture(c)}
function makeTree(x,z){let g=new THREE.Group(),tr=box(1.5,6,1.5,0x62432c);tr.position.y=3;g.add(tr);let c=new THREE.Mesh(new THREE.SphereGeometry(5,16,12),mat(0x2e7735));c.position.y=8;c.castShadow=true;g.add(c);g.position.set(x,0,z);scene.add(g)}
function makePlayer(){
 player=new THREE.Group();let legs=box(1.7,1.8,1.1,0x202b48);legs.position.y=.9;player.add(legs);let body=box(2.3,2.5,1.3,0x315de8);body.position.y=2.9;player.add(body);
 let head=new THREE.Mesh(new THREE.SphereGeometry(1.03,24,18),mat(0xc99170));head.position.y=4.7;head.castShadow=true;player.add(head);
 let hair=new THREE.Mesh(new THREE.SphereGeometry(1.06,24,10,0,Math.PI*2,0,Math.PI*.45),mat(0x241b18));hair.position.y=5.05;player.add(hair);
 player.position.set(0,0,0);scene.add(player)
}
function carModel(color=0x315de8,name="Sports Car",type="car"){
 let g=new THREE.Group();g.userData={name,type,speed:0};let base=box(5.4,1.15,9.5,color,.3,.2);base.position.y=1.25;g.add(base);
 let cabin=box(4.25,1.55,4.4,0x17232c,.12,.6);cabin.position.set(0,2.45,-.3);g.add(cabin);
 let glass=box(4.02,1.1,3.75,0x6f9bb2,.08,.7);glass.position.set(0,2.55,-.25);g.add(glass);
 for(let sx of [-1,1])for(let z of [-3.05,3.05]){let w=new THREE.Mesh(new THREE.CylinderGeometry(.76,.76,.58,20),mat(0x111315,.55,.1));w.rotation.z=Math.PI/2;w.position.set(sx*2.72,.8,z);w.castShadow=true;g.add(w)}
 let l1=box(.65,.45,.18,0xfff3bd,.2);l1.position.set(-1.55,1.5,-4.8);g.add(l1);let l2=l1.clone();l2.position.x=1.55;g.add(l2);return g
}
function makeCar(){car=carModel();car.position.set(15,0,15);scene.add(car)}
function makeTraffic(){for(let i=0;i<36;i++){let c=carModel([0xc62828,0xf4c20d,0x1976d2,0xf2f2f2,0x202020,0x00897b][i%6],"Traffic");c.position.set((Math.random()-.5)*1500,0,(Math.random()-.5)*1500);c.userData.axis=i%2;scene.add(c);traffic.push(c)}}
function makePeople(){for(let i=0;i<70;i++){let g=new THREE.Group(),b=box(1.1,2.25,1,Math.random()*0xffffff);b.position.y=1.12;g.add(b);g.position.set((Math.random()-.5)*1400,0,(Math.random()-.5)*1400);g.userData.a=Math.random()*6.28;scene.add(g);people.push(g)}}
function makePolice(){for(let i=0;i<8;i++){let p=carModel(0x111820,"Police");p.visible=false;scene.add(p);police.push(p)}}
function makeMarkers(){let spots=[[-300,-300],[-225,-225],[225,-225],[225,-100],[380,300],[500,500]];spots.forEach((s,i)=>{let m=new THREE.Mesh(new THREE.TorusGeometry(5,.42,12,40),new THREE.MeshBasicMaterial({color:i===5?0x32ef78:0xffd21c}));m.rotation.x=Math.PI/2;m.position.set(s[0],.4,s[1]);scene.add(m);markers.push(m)})}
function controls(){
 addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()=="e")interact();if(e.key.toLowerCase()=="p")togglePanel()});
 addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
 $("jump").onpointerdown=jumpAction;$("run").onpointerdown=()=>running=true;$("run").onpointerup=()=>running=false;$("car").onpointerdown=interact;$("interact").onpointerdown=interact;$("phone").onpointerdown=togglePanel;
 let j=$("joy"),k=$("knob");function set(e){let r=j.getBoundingClientRect(),x=e.clientX-r.left-69,y=e.clientY-r.top-69,d=Math.min(50,Math.hypot(x,y)),a=Math.atan2(y,x);joy.x=Math.cos(a)*d/50;joy.y=Math.sin(a)*d/50;k.style.transform=`translate(${joy.x*42}px,${joy.y*42}px)`}
 j.onpointerdown=e=>{j.setPointerCapture(e.pointerId);set(e)};j.onpointermove=e=>{if(e.buttons)set(e)};j.onpointerup=()=>{joy.x=joy.y=0;k.style.transform=""};
 addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)})
}
function togglePanel(){if(!$("panel").classList.contains("hidden")){closePanel();return}showPhone()}
function showPhone(){$("panel").classList.remove("hidden");$("panel").innerHTML=`<h2>📱 TASDIK PHONE</h2><button onclick="showMap()">🗺 MAP</button><button onclick="showMissions()">📋 MISSIONS</button><button onclick="cycleWeather()">🌦 WEATHER</button><button onclick="garage()">🚗 GARAGE</button><button onclick="customize()">👕 CUSTOMIZE</button><button onclick="inventory()">🎒 INVENTORY</button><button onclick="saveGame();toast('Game saved')">💾 SAVE</button><button onclick="closePanel()">CLOSE</button>`}
function closePanel(){$("panel").classList.add("hidden")}
function showMap(){$("panel").innerHTML="<h2>🗺 TASDIK CITY</h2><p>Large original city with roads, buildings, shop, garage, hangar, traffic and mission locations.</p><button onclick='closePanel()'>CLOSE</button>"}
function showMissions(){$("panel").innerHTML="<h2>📋 MISSIONS</h2>"+MISSION.map((m,i)=>`<div class='row'>${i+1}. ${m[0]} — ₹${m[2]} ${i<mission?"✓":i==mission?"▶":"🔒"}</div>`).join("")+"<button onclick='closePanel()'>CLOSE</button>"}
function garage(){$("panel").innerHTML="<h2>🚗 GARAGE</h2><p>Customize your original sports car.</p><button onclick='paint(0x315de8)'>BLUE</button><button onclick='paint(0xe53935)'>RED</button><button onclick='paint(0x111111)'>BLACK</button><button onclick='paint(0xffffff)'>WHITE</button><button onclick='closePanel()'>CLOSE</button>"}
function paint(c){car.children[0].material.color.setHex(c);toast("Car customized")}
function customize(){$("panel").innerHTML="<h2>👕 CHARACTER</h2><button onclick='dress(0x315de8)'>BLUE</button><button onclick='dress(0xe91e63)'>PINK</button><button onclick='dress(0x21a366)'>GREEN</button><button onclick='dress(0xffc107)'>YELLOW</button><button onclick='closePanel()'>CLOSE</button>"}
function dress(c){player.children[1].material.color.setHex(c);toast("Outfit changed")}
function inventory(){$("panel").innerHTML=`<h2>🎒 INVENTORY</h2><div class='row'>💵 Cash: ₹${money}</div><div class='row'>🍔 Food: ${localStorage.food||0}</div><div class='row'>⛽ Fuel: ${localStorage.fuel||0}</div><button onclick='closePanel()'>CLOSE</button>`}
function interact(){if(inCar){inCar=false;player.visible=true;player.position.copy(car.position).add(new THREE.Vector3(4,0,0));toast("Exited vehicle");return}if(player.position.distanceTo(car.position)<11){inCar=true;player.visible=false;toast("Entered Sports Car");return}if(player.position.distanceTo(new THREE.Vector3(-225,0,-225))<48)shop();if(player.position.distanceTo(new THREE.Vector3(225,0,-225))<48)garage()}
function shop(){$("panel").classList.remove("hidden");$("panel").innerHTML="<h2>🏪 CITY SHOP</h2><button onclick='buy(50)'>FOOD ₹50</button><button onclick='buy(100)'>FUEL ₹100</button><button onclick='closePanel()'>CLOSE</button>"}
function buy(n){if(money>=n){money-=n;if(n===50)localStorage.food=(+localStorage.food||0)+1;else localStorage.fuel=(+localStorage.fuel||0)+1;toast("Purchase complete")}else toast("Not enough money")}
function jumpAction(){if(jumping||inCar)return;jumping=true;let t=0;function f(){t+=.13;player.position.y=Math.sin(t)*4;if(t<Math.PI)requestAnimationFrame(f);else{player.position.y=0;jumping=false}}f()}
function cycleWeather(){weather=weather==="clear"?"rain":weather==="rain"?"fog":"clear";if(weather==="rain"){scene.background.set(0x5b6b75);scene.fog=new THREE.Fog(0x66737b,100,500)}else if(weather==="fog"){scene.background.set(0x9d9d9d);scene.fog=new THREE.Fog(0xaaaaaa,50,210)}else{scene.background.set(0x86b9df);scene.fog=new THREE.Fog(0x9fb8c5,260,1100)}toast(weather.toUpperCase())}
function update(dt){
 let x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+joy.x,y=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+joy.y,l=Math.hypot(x,y);if(l>1){x/=l;y/=l}
 if(inCar){car.position.x+=x*dt*34;car.position.z+=y*dt*34;car.rotation.y=Math.atan2(x,y);let sp=Math.round(Math.min(170,l*100));$("speed").textContent=sp+" KM/H";if(sp>90)wanted=Math.min(5,wanted+dt*.035)}
 else{let s=(running&&stamina>0?15:9)*dt;player.position.x+=x*s;player.position.z+=y*s;stamina=Math.max(0,Math.min(100,stamina+(running?-21:13)*dt));if(l>.1)player.rotation.y=Math.atan2(x,y);$("speed").textContent="0 KM/H"}
 if(inCar)player.position.copy(car.position);
 traffic.forEach((c,i)=>{if(c.userData.axis)c.position.x+=dt*(12+(i%4)*2);else c.position.z-=dt*(12+(i%4)*2);if(c.position.x>850)c.position.x=-850;if(c.position.z<-850)c.position.z=850});
 people.forEach(p=>{p.userData.a+=(Math.random()-.5)*dt*.2;p.position.x+=Math.cos(p.userData.a)*dt*1.25;p.position.z+=Math.sin(p.userData.a)*dt*1.25});
 let chase=wanted>.2;cops.forEach((p,i)=>{p.visible=chase;if(chase){let a=i*Math.PI*2/cops.length;let target=new THREE.Vector3(player.position.x+Math.cos(a)*28,0,player.position.z+Math.sin(a)*28);p.position.lerp(target,Math.min(1,dt*.5));p.rotation.y=Math.atan2(player.position.x-p.position.x,player.position.z-p.position.z);if(p.position.distanceTo(player.position)<8){hp=Math.max(0,hp-dt*4);wanted=Math.max(0,wanted-dt*.12)}}});wanted=Math.max(0,wanted-dt*.024);
 if(markers[mission]&&player.position.distanceTo(markers[mission].position)<11&&(mission!==4||wanted<.1))completeMission()
}
function completeMission(){let r=MISSION[mission][2];money+=r;xp+=50;if(xp>=100){xp-=100;level++}toast("MISSION COMPLETE +₹"+r);mission=Math.min(mission+1,MISSION.length-1);updateMission();saveGame()}
function updateMission(){let m=MISSION[mission];$("missionTitle").textContent=m[0];$("missionText").textContent=m[1];$("missionReward").textContent="Reward ₹"+m[2]}
function hud(){ $("hp").textContent=Math.round(hp);$("st").textContent=Math.round(stamina);$("wanted").textContent=Math.round(wanted);$("cash").textContent=money;$("level").textContent="LV "+level;$("xp").textContent="XP "+Math.round(xp)+"/100";$("vehicle").textContent=inCar?"SPORTS CAR":"ON FOOT";let c=$("map").getContext("2d");c.clearRect(0,0,180,180);c.fillStyle="#17252c";c.fillRect(0,0,180,180);c.strokeStyle="#64747c";for(let i=0;i<13;i++){c.beginPath();c.moveTo(i*15,0);c.lineTo(i*15,180);c.stroke();c.beginPath();c.moveTo(0,i*15);c.lineTo(180,i*15);c.stroke()}c.fillStyle="#35ef7b";c.fillRect(87,87,6,6)}
function toast(t){let e=$("toast");e.textContent=t;e.style.opacity=1;clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>e.style.opacity=0,1800)}
function saveGame(){localStorage.setItem("tasdikV7",JSON.stringify({hp,stamina,wanted,money,xp,level,mission,weather}))}
function loadGame(){try{let s=JSON.parse(localStorage.getItem("tasdikV7")||"null");if(s){hp=s.hp;stamina=s.stamina;wanted=s.wanted;money=s.money;xp=s.xp;level=s.level;mission=s.mission;weather=s.weather;if(weather==="rain")cycleWeather();else if(weather==="fog"){cycleWeather();cycleWeather()}updateMission()}}catch(e){}}
function animate(){requestAnimationFrame(animate);let dt=Math.min(.05,clock.getDelta());update(dt);hud();let target=(inCar?car:player).position.clone();target.y+=3.3;let off=new THREE.Vector3(0,9.5,20).applyAxisAngle(new THREE.Vector3(0,1,0),(inCar?car.rotation.y:player.rotation.y));camera.position.lerp(target.clone().add(off),.075);camera.lookAt(target);renderer.render(scene,camera)}
setInterval(saveGame,10000);
