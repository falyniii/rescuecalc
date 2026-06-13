(function(){
  try { var saved = sessionStorage.getItem('_RESCUE_STOP_DATA'); if(saved){ window._STOP_DATA = JSON.parse(saved); } } catch(e){}
  window._STOP_DATA = window._STOP_DATA || {};
  if(document.getElementById('rescue-calc-panel')){ document.getElementById('rescue-calc-panel').style.display='flex'; return; }
  var style = document.createElement('style');
  style.textContent = '#rescue-calc-panel{position:fixed;top:10px;right:10px;width:340px;max-height:90vh;overflow-y:auto;background:#1a1a2e;color:#eee;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.7);z-index:999999;display:flex;flex-direction:column;font-family:Arial,sans-serif;font-size:13px;padding:14px;}#rescue-calc-panel h2{margin:0 0 10px;font-size:15px;color:#f90;text-align:center;}#rescue-calc-panel label{display:block;margin:6px 0 2px;color:#aaa;font-size:11px;}#rescue-calc-panel select,#rescue-calc-panel input{width:100%;box-sizing:border-box;background:#16213e;color:#eee;border:1px solid #444;border-radius:6px;padding:5px;font-size:12px;}.rc-btn{width:100%;padding:8px;margin-top:8px;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:bold;}.rc-load{background:#0f3460;color:#eee;}.rc-calc{background:#f90;color:#000;}.rc-copy{background:#28a745;color:#fff;margin-top:4px;}.rc-close{background:#555;color:#eee;margin-top:4px;}.rc-clear{background:#7a0000;color:#eee;margin-top:4px;font-size:11px;padding:5px;}#rc-status{margin-top:8px;padding:6px;background:#0d1117;border-radius:6px;font-size:11px;color:#8bc;min-height:30px;}#rc-result{margin-top:10px;padding:10px;background:#0d2137;border-radius:8px;display:none;}#rc-result .rc-meet{font-size:14px;font-weight:bold;color:#f90;margin-bottom:6px;}#rc-result .rc-row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #1e3a5f;font-size:12px;}#rc-result .rc-row:last-child{border-bottom:none;}#rc-result .rc-lbl{color:#aaa;}#rc-result .rc-val{color:#eee;font-weight:bold;}';
  document.head.appendChild(style);
  var panel = document.createElement('div');
  panel.id = 'rescue-calc-panel';
  panel.innerHTML = '<h2>RESCUE INTERCEPT CALC</h2><div style="background:#0d1117;border-radius:6px;padding:8px;margin-bottom:8px;font-size:11px;color:#8bc;"><b style="color:#f90;">HOW TO USE:</b><br>1. Go to Rescue Driver route page, click Load Stops<br>2. Go to Driver in Need route page, click Load Stops<br>3. Select routes, enter current stop, click Calculate</div><label>RESCUE DRIVER ROUTE</label><select id="rc-rescue-route"><option value="">-- Load stops first --</option></select><label>DRIVER IN NEED OF SUPPORT</label><select id="rc-struggling-route"><option value="">-- Load stops first --</option></select><button class="rc-btn rc-load" id="rc-load-btn">Load Stops from Current Route Page</button><button class="rc-btn rc-clear" id="rc-clear-btn">Clear All Saved Stop Data</button><label>DRIVER IN NEED - CURRENT STOP #</label><input type="number" id="rc-current-stop" value="50" min="1"><label>CURRENT TIME (24h e.g. 01:56)</label><input type="text" id="rc-current-time" value="01:56"><label>MAX WAIT AT STOP (minutes)</label><input type="number" id="rc-max-wait" value="7" min="1" max="30"><button class="rc-btn rc-calc" id="rc-calc-btn">Calculate Intercept Point</button><div id="rc-status">Ready. Go to a driver route page and click Load Stops.</div><div id="rc-result"><div class="rc-meet" id="rc-meet-stop"></div><div class="rc-row"><span class="rc-lbl">Address</span><span class="rc-val" id="rc-meet-addr"></span></div><div class="rc-row"><span class="rc-lbl">Distance</span><span class="rc-val" id="rc-meet-dist"></span></div><div class="rc-row"><span class="rc-lbl">Drive Time</span><span class="rc-val" id="rc-meet-drive"></span></div><div class="rc-row"><span class="rc-lbl">Driver in Need ETA</span><span class="rc-val" id="rc-need-eta"></span></div><div class="rc-row"><span class="rc-lbl">Rescue Arrives</span><span class="rc-val" id="rc-rescue-eta"></span></div><div class="rc-row"><span class="rc-lbl">Wait Time</span><span class="rc-val" id="rc-wait"></span></div><button class="rc-btn rc-copy" id="rc-copy-btn">Copy Address</button></div><button class="rc-btn rc-close" id="rc-close-btn">Close</button>';
  document.body.appendChild(panel);
  function setStatus(msg){ document.getElementById('rc-status').textContent=msg; }
  function saveToSession(){ try{ sessionStorage.setItem('_RESCUE_STOP_DATA',JSON.stringify(window._STOP_DATA)); }catch(e){} }
  function updateDropdowns(){
    var seen={}, routes=[];
    Object.keys(window._STOP_DATA).forEach(function(k){ var d=window._STOP_DATA[k]; if(!d||!d.label) return; if(!seen[d.label]){ seen[d.label]=true; routes.push({key:k,label:d.label}); } });
    ['rc-rescue-route','rc-struggling-route'].forEach(function(id){ var sel=document.getElementById(id), prev=sel.value; sel.innerHTML='<option value="">-- Select --</option>'; routes.forEach(function(r){ var opt=document.createElement('option'); opt.value=r.key; opt.textContent=r.label; sel.appendChild(opt); }); if(prev) sel.value=prev; });
  }
  function parseStopsFromPage(){
    var text=document.body.innerText, lines=text.split('
').map(function(l){ return l.trim(); }).filter(function(l){ return l.length>0; });
    var cx=null,driverName=null,routeId=null;
    var urlMatch=window.location.pathname.match(/routes/([w-]+)/); if(urlMatch) routeId=urlMatch[1];
    for(var i=0;i<lines.length;i++){ var cxMatch=lines[i].match(/^(CXd+)$/); if(cxMatch){ cx=cxMatch[1]; for(var j=i+1;j<Math.min(i+8,lines.length);j++){ var l=lines[j]; if(l.match(/^CXd+$/)||l.match(/^d+$/)||l==='Contact') continue; if(l.match(/^[A-Z][a-z]+ [A-Z][a-z]+/)||l.match(/^[A-Z][a-z]+$/)){ driverName=l; break; } } break; } }
    var pace=15; var paceMatch=text.match(/(d+)s*stops?/hr/i); if(paceMatch) pace=parseInt(paceMatch[1]);
    var stops=[],stopNums=new Set();
    for(var i=0;i<lines.length-1;i++){ var numMatch=lines[i].match(/^(d{1,3})$/); if(!numMatch) continue; var num=parseInt(numMatch[1]); if(num<1||num>400) continue; if(stopNums.has(num)) continue; var ctx=lines[i-1]||''; if(ctx.match(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)) continue; if(ctx.match(/CXd+/)) continue; var nextLine=lines[i+1]||''; if(nextLine.length<5) continue; if(nextLine.match(/^d+$/)||nextLine.match(/^CXd+$/)) continue; if(nextLine.match(/stops?/hr|packages|completed|remaining/i)) continue; stopNums.add(num); stops.push({num:num,address:nextLine}); }
    stops.sort(function(a,b){ return a.num-b.num; });
    return {cx:cx,driverName:driverName,routeId:routeId,pace:pace,stops:stops};
  }
  document.getElementById('rc-load-btn').addEventListener('click',function(){
    setStatus('Parsing stops from page...');
    var parsed=parseStopsFromPage();
    if(!parsed.stops||parsed.stops.length<2){ setStatus('Could not parse stops. Go to a route detail page first.'); return; }
    var key=parsed.cx||parsed.routeId||'route_'+Date.now();
    var label=(parsed.cx||key)+(parsed.driverName?' - '+parsed.driverName:'')+' ('+parsed.pace+'/hr)';
    window._STOP_DATA[key]={label:label,cx:parsed.cx,driverName:parsed.driverName,routeId:parsed.routeId,pace:parsed.pace,stops:parsed.stops,lastStop:parsed.stops[parsed.stops.length-1].address};
    if(parsed.routeId&&parsed.cx) window._STOP_DATA[parsed.routeId]=window._STOP_DATA[key];
    saveToSession();
    updateDropdowns();
    var cxKeys=Object.keys(window._STOP_DATA).filter(function(k){ return k.startsWith('CX')&&window._STOP_DATA[k]&&window._STOP_DATA[k].label; });
    if(cxKeys.length===1){ document.getElementById('rc-rescue-route').value=cxKeys[0]; }
    else if(cxKeys.length>=2){ var rs=document.getElementById('rc-rescue-route').value; if(!rs){ document.getElementById('rc-rescue-route').value=cxKeys[0]; rs=cxKeys[0]; } var other=cxKeys.find(function(r){ return r!==rs; }); if(other&&!document.getElementById('rc-struggling-route').value) document.getElementById('rc-struggling-route').value=other; }
    setStatus('Loaded '+parsed.stops.length+' stops for '+label+'. Now go to the other driver route page and load their stops.');
  });
  document.getElementById('rc-clear-btn').addEventListener('click',function(){ window._STOP_DATA={}; try{ sessionStorage.removeItem('_RESCUE_STOP_DATA'); }catch(e){} updateDropdowns(); document.getElementById('rc-result').style.display='none'; setStatus('All stop data cleared.'); });
  function geocode(addr){ return fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+encodeURIComponent(addr)).then(function(r){ return r.json(); }).then(function(d){ return d.length?{lat:parseFloat(d[0].lat),lon:parseFloat(d[0].lon)}:null; }); }
  function getDriveInfo(from,to){ return fetch('https://router.project-osrm.org/route/v1/driving/'+from.lon+','+from.lat+';'+to.lon+','+to.lat+'?overview=false').then(function(r){ return r.json(); }).then(function(d){ return d.routes&&d.routes.length?{durationMin:d.routes[0].duration/60,distanceMiles:d.routes[0].distance*0.000621371}:{durationMin:30,distanceMiles:20}; }); }
  function parseTime(t){ var p=t.split(':'); return parseInt(p[0])*60+parseInt(p[1]); }
  function fmtTime(mins){ var m2=((mins%1440)+1440)%1440,h=Math.floor(m2/60),m=Math.floor(m2%60),ampm=h>=12?'pm':'am',h12=h%12||12; return h12+':'+(m<10?'0':'')+m+ampm; }
  document.getElementById('rc-calc-btn').addEventListener('click',async function(){
    var rk=document.getElementById('rc-rescue-route').value,nk=document.getElementById('rc-struggling-route').value,cs=parseInt(document.getElementById('rc-current-stop').value),ct=document.getElementById('rc-current-time').value,mw=parseFloat(document.getElementById('rc-max-wait').value);
    if(!rk||!nk){ setStatus('Select both routes first.'); return; }
    if(rk===nk){ setStatus('Select two different routes.'); return; }
    var rd=window._STOP_DATA[rk],nd=window._STOP_DATA[nk];
    if(!rd||!nd){ setStatus('Stop data missing. Load stops for both routes.'); return; }
    setStatus('Geocoding rescue driver location...');
    var rc=await geocode(rd.lastStop+' NJ');
    if(!rc) rc=await geocode(rd.lastStop);
    if(!rc){ setStatus('Could not geocode: '+rd.lastStop); return; }
    var now=parseTime(ct),pace=nd.pace||15,ns=nd.stops,si=ns.findIndex(function(s){ return s.num>=cs; });
    if(si<0) si=0;
    setStatus('Checking intercept points...');
    var found=null;
    for(var i=si;i<Math.min(si+35,ns.length);i++){
      var stop=ns[i],ahead=stop.num-cs,nEta=now+(ahead/pace)*60;
      var sc=await geocode(stop.address+' NJ');
      if(!sc) sc=await geocode(stop.address);
      if(!sc) continue;
      var di=await getDriveInfo(rc,sc),rArr=now+di.durationMin,wait=rArr-nEta;
      if(wait>=0&&wait<=mw){ found={stopNum:stop.num,address:stop.address,distanceMiles:di.distanceMiles,driveMin:di.durationMin,needEta:nEta,rescueEta:rArr,waitMins:wait}; break; }
      setStatus('Stop #'+stop.num+': wait='+wait.toFixed(1)+'min...');
    }
    if(!found){ setStatus('No intercept found in next 35 stops. Increase max wait or check stop number.'); return; }
    document.getElementById('rc-meet-stop').textContent='Meet at Stop #'+found.stopNum;
    document.getElementById('rc-meet-addr').textContent=found.address;
    document.getElementById('rc-meet-dist').textContent=found.distanceMiles.toFixed(1)+' miles';
    document.getElementById('rc-meet-drive').textContent=found.driveMin.toFixed(1)+' min drive';
    document.getElementById('rc-need-eta').textContent=fmtTime(found.needEta);
    document.getElementById('rc-rescue-eta').textContent=fmtTime(found.rescueEta);
    document.getElementById('rc-wait').textContent=found.waitMins.toFixed(1)+' min';
    document.getElementById('rc-result').style.display='block';
    setStatus('Intercept found! Rescue arrives '+found.waitMins.toFixed(1)+' min after driver in need.');
  });
  document.getElementById('rc-copy-btn').addEventListener('click',function(){ var addr=document.getElementById('rc-meet-addr').textContent; navigator.clipboard.writeText(addr).then(function(){ setStatus('Copied: '+addr); }); });
  document.getElementById('rc-close-btn').addEventListener('click',function(){ document.getElementById('rescue-calc-panel').style.display='none'; });
  updateDropdowns();
  var cnt=Object.keys(window._STOP_DATA).filter(function(k){ return window._STOP_DATA[k]&&window._STOP_DATA[k].label; }).length;
  if(cnt>0) setStatus('Restored '+cnt+' saved route(s). Select routes to calculate.');
})();
