"use strict";function onMagicButtonClick(e){return e.preventDefault(),state.mediaLoad<5?void alert("Вы что-то забыли :)"):state.mediaLoad<6?(setTimeout(onMagicButtonClick.bind(this,e),400),void(document.querySelector("#popup .popup").style.opacity="0.5")):(player.appendChild(canvas),canvas.width=videoWidth,canvas.height=videoHeight,backCanvas.width=videoWidth,backCanvas.height=videoHeight,ctx.fillStyle=canvasBgColor,ctx.fillRect(0,0,canvas.width,canvas.height),player.appendChild(ui.block),void document.querySelector("#popup").remove())}function onPlayPause(e){video.paused||video.ended?(state.paused=!1,video.play(),audio.play(),ui.play.classList.remove("paused")):(state.paused=!0,video.pause(),audio.pause(),ui.play.classList.add("paused"))}function onInputChange(e,t){var i=new FileReader;"subtitles"===e?(i.readAsText(t.target.files[0]),state.mediaLoad++,i.onloadend=function(e){subtitles=parseSrt(i.result),state.mediaLoad++}):"audio"===e?(i.readAsDataURL(t.target.files[0]),state.mediaLoad++,i.onloadend=function(e){audio=createAudio(i.result),state.mediaLoad++}):"video"===e&&(i.readAsDataURL(t.target.files[0]),state.mediaLoad++,i.onloadend=function(e){video=createVideo(i.result),state.mediaLoad++})}function createAudio(e){var t=document.createElement("audio");return t.src=e,t.autoplay=!1,t.volume=.5,t}function createVideo(e){var t=document.createElement("video");return t.src=e,t.autoplay=!1,t.controls=!1,t.defaultMuted=!0,t.style.visibility="hidden",t.addEventListener("play",onVideoPlay,!1),t.addEventListener("loadeddata",function(e){document.querySelector("body").appendChild(t),videoSizeRatio=t.clientWidth/t.clientHeight,videoWidth=parseInt(getComputedStyle(player).width).toFixed(),videoHeight=videoWidth/videoSizeRatio,t.style.display="none",videoTimelineRatio=t.duration/100,subtitleStyles.padding=videoWidth*subtitleStyles.paddingRatio,subtitleStyles.fontSize=videoHeight*subtitleStyles.fontRatio,subtitleStyles.lineInterval=subtitleStyles.fontSize*subtitleStyles.lineIntervalRatio}),t.addEventListener("timeupdate",function(e){var i=(1e3*e.target.currentTime).toFixed();i>=subtitles[state.subtitleIndex].endTime&&(state.subtitleShown=!0,t.pause(),state.subtitleTimer=setTimeout(hideSubtitle,subtitles[state.subtitleIndex].timeLength))}),t}function createUI(){var e={block:document.createElement("div"),play:document.createElement("div"),stop:document.createElement("div"),timeline:document.createElement("input"),volume:document.createElement("input")};return e.block.classList.add("player-ui"),e.block.appendChild(e.play),e.block.appendChild(e.stop),e.block.appendChild(e.timeline),e.block.appendChild(e.volume),e.play.classList.add("player-ui__el","player-ui__el_play-pause","paused"),e.stop.classList.add("player-ui__el","player-ui__el_stop"),e.timeline.setAttribute("type","range"),e.timeline.classList.add("player-ui__el","player-ui__el_timeline"),e.timeline.value=0,e.volume.setAttribute("type","range"),e.volume.setAttribute("touch-action","none"),e.volume.classList.add("player-ui__el","player-ui__el_volume"),e.play.addEventListener("click",onPlayPause),e.stop.addEventListener("click",function(t){video.pause(),audio.pause(),video.currentTime=0,audio.currentTime=0,state.subtitleIndex=0,e.play.classList.add("paused"),e.timeline.value=0}),e.timeline.addEventListener("change",function(e){video.currentTime=parseInt(e.target.value)*videoTimelineRatio,audio.currentTime=video.currentTime}),e.volume.addEventListener("pointerdown",function(e){e.target.addEventListener("pointermove",onVolumeChange),e.target.addEventListener("pointerup",onVolumeChangeEnd)}),e.volume.addEventListener("click",function(e){audio.volume=e.target.value/100,0===audio.volume?e.target.classList.add("muted"):e.target.classList.remove("muted")}),e}function onVideoPlay(e){drawVideo(video,canvas,backCanvas,videoWidth,videoHeight),audio.play()}function onVolumeChange(e){audio.volume=parseInt(e.target.value)/100,0===audio.volume?e.target.classList.add("muted"):e.target.classList.remove("muted")}function onVolumeChangeEnd(e){e.target.removeEventListener("pointermove",onVolumeChange),e.target.removeEventListener("pointerup",onVolumeChangeEnd)}function drawVideo(e,t,i,a,n){if(state.paused||e.ended||state.stopped)return!1;var o=t.getContext("2d"),d=i.getContext("2d");if(!e.paused&&!state.subtitleShown){d.clearRect(0,0,a,n),o.clearRect(0,0,a,n),d.drawImage(e,0,0,a,n);for(var s=d.getImageData(0,0,a,n),l=s.data,r=getRandomInt(100-100*brightnessDiffRatio,100+100*brightnessDiffRatio)/100,u=0;u<l.length;u+=4){var c=getRandomInt(100-100*grainDiffRatio,100+100*grainDiffRatio)/100,v=l[u],p=l[u+1],m=l[u+2],g=(.21*v+.72*p+.07*m)*r*c;l[u]=g+15*c,l[u+1]=g+10*c,l[u+2]=g}o.putImageData(s,0,0)}state.subtitleShown&&showSubtitle(subtitles[state.subtitleIndex]),Math.random()<scratchStyle.frequency&&requestAnimationFrame(function(){drawScratches(t)});var h=1e3/getRandomInt(minFps,maxFps);setTimeout(drawVideo,h,e,t,i,videoWidth,videoHeight)}function drawScratches(e){for(var t=e.getContext("2d"),i=(e.width,e.height,Math.floor(getRandomInt(0,100)-90)),a=0;a<=i;a++){var n=generateSingleScratch(e);t.strokeStyle=n.style,t.lineWidth=n.width,t.beginPath(),t.moveTo(n.coords.from.x,n.coords.from.y),t.lineTo(n.coords.to.x,n.coords.to.y),t.stroke(),t.closePath()}}function generateSingleScratch(e){var t=(e.getContext("2d"),e.width),i=e.height,a=getRandomInt(scratchStyle.minOpacity,scratchStyle.maxOpacity)/100,n=getRandomInt(140,180),o={r:getRandomInt(-20,20),g:getRandomInt(-20,20),b:getRandomInt(-20,20)},d={r:n+o.r,g:n+o.g,b:n+o.b,a:a},s="rgba("+d.r+", "+d.g+", "+d.b+", "+d.a+")",l=getRandomInt(1,2),r=2*Math.round(Math.random()),u=2*Math.round(Math.random()),c=getRandomInt(i*scratchStyle.minLength/100,i*scratchStyle.maxLength/100),v=getRandomInt(0,c),p=Math.sqrt(Math.pow(c,2)-Math.pow(v,2)),m={x:getRandomInt(0,t),y:getRandomInt(0,i)},g={x:m.x+v-v*r,y:m.y+p-p*u},h={from:m,to:g};return{style:s,width:l,coords:h}}function showSubtitle(e){if(!state.subtitleShown)return console.log("Don't show :("),!1;var t=getRandomInt(100-100*brightnessDiffRatio,100+100*brightnessDiffRatio)/100,i={r:(canvasBgColor.r*t).toFixed(),g:(canvasBgColor.g*t).toFixed(),b:(canvasBgColor.b*t).toFixed()};console.dir(i),ctx.fillStyle="rgb("+i.r+", "+i.g+", "+i.b+")",ctx.fillRect(0,0,canvas.width,canvas.height),ctx.fillStyle=canvasTextColor,ctx.font=subtitleStyles.fontSize+"px Oranienbaum bold, serif";var a=e.content.length*subtitleStyles.fontSize+(e.content.length-1)*subtitleStyles.lineInterval,n=(videoHeight-a)/2;e.content.forEach(function(e,t){var i=n+subtitleStyles.fontSize*t+subtitleStyles.lineInterval*t,a=subtitleStyles.padding;ctx.fillText(e,a,i)})}function hideSubtitle(){state.subtitleShown=!1,state.subtitleIndex++,video.play()}function parseSrt(e){var t={sec:1e3,min:60,hr:60},i=e.split("\n\n"),a=i.map(function(e){var i={},a=e.split("\n");i.number=parseInt(a[0]);var n=a[1].split(" --> "),o=n[0].split(":"),d=parseInt(o[2].split(",").join("")),s=parseInt(o[1])*t.min*t.sec,l=parseInt(o[0])*t.hr*t.min*t.sec;o=d+s+l,i.startTime=o;var r=n[1].split(":"),u=parseInt(r[2].split(",").join("")),c=parseInt(r[1])*t.min*t.sec,v=parseInt(r[0])*t.hr*t.min*t.sec;return r=u+c+v,i.endTime=r,i.timeLength=r-o,a.splice(0,2),i.content=a,i});return a}function onWindowResize(e){videoWidth=parseInt(getComputedStyle(player).width).toFixed(),videoHeight=videoWidth/videoSizeRatio,canvas.width=videoWidth,canvas.height=videoHeight,backCanvas.width=videoWidth,backCanvas.height=videoHeight,subtitleStyles.padding=videoWidth*subtitleStyles.paddingRatio,subtitleStyles.fontSize=videoHeight*subtitleStyles.fontRatio,subtitleStyles.lineInterval=subtitleStyles.fontSize*subtitleStyles.lineIntervalRatio}function getRandomInt(e,t){return Math.floor(Math.random()*(t-e))+e}function download(e,t){var i=this,a=new XMLHttpRequest;a.open("GET",t,!0),a.withCredentials=!0,a.responseTye="blob",a.onload=function(t){if(200===i.status){new Blob([i.response],{type:e})}},a.send()}var urls={video:"https://cache-default04g.cdn.yandex.net/kp.cdn.yandex.net/502838/kinopoisk.ru-Sherlock-284167.mp4",videoLocal:"../assets/kinopoisk.ru-Sherlock-284167.mp4",audio:"https://upload.wikimedia.org/wikipedia/commons/2/2c/The_Entertainer_-_1902_-_By_Scott_Joplin.ogg",audioLocal:"../assets/The_Entertainer_-_1902_-_By_Scott_Joplin.ogg",srt:"https://raw.githubusercontent.com/shri-msk-2016/dz-multimedia/master/subs.srt",srtLocal:"../assets/subs.srt"},magicButton=document.getElementById("magic-button"),videoInput=document.getElementById("video"),audioInput=document.getElementById("audio"),subtitlesInput=document.getElementById("subtitles"),player=document.getElementById("player"),ui=createUI(),backCanvas=document.createElement("canvas"),canvas=document.createElement("canvas"),ctx=canvas.getContext("2d"),bodyStyle=getComputedStyle(document.querySelectorAll("body")[0]),bodyPadding=parseInt(bodyStyle.paddingLeft)+parseInt(bodyStyle.paddingRight),canvasBgColor={r:16,g:20,b:16,hex:"#101410"},canvasTextColor="#e1e8e2",brightnessDiffRatio=.2,grainDiffRatio=.15,minFps=18,maxFps=26,scratchStyle={minLength:5,maxLength:20,minOpacity:30,maxOpacity:90,frequency:.75},subtitleStyles={fontRatio:.055,paddingRatio:.1,lineIntervalRatio:.5},state={subtitleShown:!1,subtitleIndex:0,mediaLoad:0,paused:!0},videoWidth=void 0,videoHeight=void 0,videoSizeRatio=void 0,videoTimelineRatio=void 0,video=void 0,audio=void 0,subtitles=void 0;magicButton.addEventListener("click",onMagicButtonClick),videoInput.addEventListener("change",onInputChange.bind(void 0,"video")),audioInput.addEventListener("change",onInputChange.bind(void 0,"audio")),subtitlesInput.addEventListener("change",onInputChange.bind(void 0,"subtitles")),canvas.addEventListener("click",onPlayPause),window.addEventListener("resize",onWindowResize);
//# sourceMappingURL=index.js.map
