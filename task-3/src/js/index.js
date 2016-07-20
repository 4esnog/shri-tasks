'use strict';

// Get existing DOM nodes
const magicButton = document.getElementById('magic-button');
const videoInput = document.getElementById('video');
const audioInput = document.getElementById('audio');
const subtitlesInput = document.getElementById('subtitles');
const player = document.getElementById('player');

// Init player UI
const ui = createUI();

// Init canvas w/ styles
const backCanvas = document.createElement('canvas');
const canvas = document.createElement('canvas');
backCanvas.setAttribute('crossorigin', 'anonymus');
canvas.setAttribute('crossorigin', 'anonymus');
const	ctx = canvas.getContext('2d');


let bodyStyle = getComputedStyle(document.querySelectorAll('body')[0]);
let bodyPadding = parseInt(bodyStyle.paddingLeft) + parseInt(bodyStyle.paddingRight);

// === НАСТРОЙКИ ===
// Цвет фона субтитров
const canvasBgColor = {
	r: 16,
	g: 20,
	b: 16,
	hex: "#101410"
};
const canvasTextColor = '#e1e8e2'; // Цвет текста субтитров
const brightnessDiffRatio = 0.2; // Коэффициент разброса яркости кадров
const grainDiffRatio = 0.15; // Коэффициент зернистости (шума)
const minFps = 18;
const maxFps = 26;
const scratchStyle = {
	minLength: 5,    // Длина и прозрачность царапин,
	maxLength: 20,   // в % от высоты видео (от 0 до 100)
	minOpacity: 30,  // 0 .. 100
	maxOpacity: 90,  // 0 .. 100
	frequency: 0.75, // 0 .. 1
}
// const downsampleRatio = 5;
const subtitleStyles = {
	fontRatio: 0.055,
	paddingRatio: 0.1,
	lineIntervalRatio: 0.5
};
const volumeSpreadRatio = 0.15;
const audioBufferSize = 512;
// === END НАСТРОЙКИ ===


let state = {
	paused: true,
	subtitleShown: false,
	subtitleIndex: 0,
	subtitleTimer: 0,
	mediaLoad: 0,
};

let	videoWidth,
		videoHeight,
		videoSizeRatio,
		videoTimelineRatio,
		video,
		audio,
		subtitles,
		noiseGainNode,
		audioApi = {};


// === Set initial event handlers ===
magicButton.addEventListener('click', onMagicButtonClick);
canvas.addEventListener('click', onPlayPause);
window.addEventListener('resize', onWindowResize);


// === Helpers ===

// === Handle "Maigc" button click ===
function onMagicButtonClick(e) {
	
	e.preventDefault();
	togglePreloader(true);
	
	createVideo('http://cors.io/?u=' + videoInput.value)
		.then((videoEl) => {
			
			canvas.width = videoWidth;
			canvas.height = videoHeight;

			backCanvas.width = videoWidth;
			backCanvas.height = videoHeight;
			ctx.fillStyle = canvasBgColor;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			player.appendChild(ui.block);
			player.appendChild(canvas);

			video = videoEl;
			document.querySelector('#popup').remove();
			togglePreloader(false);
		}
	);
	
	createAudio('http://cors.io/?u=' + audioInput.value)
		.then((audioEl) => {
			audio = audioEl;
		}
	);

	fetch(subtitlesInput.value, 'GET')
		.then((text) => {
			subtitles = parseSrt(text);
		});

}

function onPlayPause(e) {
	if (state.paused || video.ended) {
		// video.play();
		state.paused = false;
		state.stopped = false;
		audio.play();
		if (state.subtitleShown) {
			// video.pause();
			drawVideo(video, canvas, backCanvas, videoWidth, videoHeight);
			state.subtitleTimer = setTimeout(hideSubtitle, subtitles[state.subtitleIndex].timeLength);
			console.dir('Resume subtitles');
		} else {
			video.play();
			console.dir('Resume without subtitles');
		}
		audioApi.mainGainNode.connect(audioApi.ctx.destination);
		ui.play.classList.remove('paused');

	} else {
		state.paused = true;
		if (state.subtitleShown) {
			clearInterval(state.subtitleTimer);
			state.subtitleEndTime = performance.now();
			state.subtitleShownTime = (state.subtitleEndTime - state.subtitleStartTime).toFixed();
			state.subtitleRestTime = subtitles[state.subtitleIndex].timeLength - state.subtitleShownTime;
		}

		video.pause();
		audio.pause();
		audioApi.mainGainNode.disconnect();
		ui.play.classList.add('paused');
	}
}

function onStop(e) {
		state.stopped = true;
		clearTimeout(state.subtitleTimer);
		video.pause();
		audio.pause();
		audioApi.mainGainNode.disconnect();
		video.currentTime = 0;
		audio.currentTime = 0;
		state.subtitleIndex = 0;
		ui.play.classList.add('paused');
		// ui.timeline.value = 0;
	}

// === Process audio from input ===
function createAudio(src) {
	return new Promise((resolve, reject) => {
		try {
			let audio = document.createElement('audio');
			audio.setAttribute('crossorigin', 'anonymus');
			audio.src = src;
			audio.autoplay = false;
			audio.addEventListener('loadeddata', (e) => {

				audioApi.ctx = new (window.AudioContext || window.webkitAudioContext)();
				audioApi.source = audioApi.ctx.createMediaElementSource(audio);
				audioApi.mainGainNode = audioApi.ctx.createGain();
				audioApi.mainGainNode.gain.value = 0.5;

				audioApi.pinkNoise = audioApi.ctx.createScriptProcessor(audioBufferSize / 2, 1, 1);

				audioApi.pinkNoise.onaudioprocess = function(e) {

					for (let ch = 0; ch < e.outputBuffer.numberOfChannels; ch++) {
						let inputData = e.inputBuffer.getChannelData(ch);
						let outputData = e.outputBuffer.getChannelData(ch);	

						for (let i = 0; i < e.inputBuffer.length; i++) {
							let white = Math.random() * 2 - 1;
							outputData[i] = inputData[i] + white * 0.03;
						}
					}

				}

				audioApi.source.connect(audioApi.mainGainNode);
				audioApi.pinkNoise.connect(audioApi.mainGainNode);

				setInterval(() => {
					audioApi.mainGainNode.gain.value += getRandomInt(
						-100 * volumeSpreadRatio,
						100 * volumeSpreadRatio) / 1000;
				}, 200);

				resolve(audio);
				
			});

		} catch(e) {

			reject(e);
		
		}
		
	});

}

// === Process video from input ===
function createVideo(src) {
	return new Promise((resolve, reject) => {
		try {

			let video = document.createElement('video');
			video.setAttribute('crossorigin', 'anonymus');
			video.setAttribute('preload', 'true');
			video.src = src;
			video.autoplay = false;
			video.controls = false;
			video.defaultMuted = true;
			video.style.visibility = 'hidden';

			video.addEventListener('play', onVideoPlay, false);
			
			video.addEventListener('loadeddata', (e) => {
				document.querySelector('body').appendChild(video);

				videoSizeRatio = video.clientWidth / video.clientHeight;
				videoWidth = parseInt(getComputedStyle(player).width).toFixed();
				videoHeight = videoWidth / videoSizeRatio;
				videoTimelineRatio = video.duration / 100;
				
				video.style.display = 'none';

				subtitleStyles.padding = videoWidth * subtitleStyles.paddingRatio;
				subtitleStyles.fontSize = videoHeight * subtitleStyles.fontRatio;
				subtitleStyles.lineInterval = subtitleStyles.fontSize * subtitleStyles.lineIntervalRatio;
				
				resolve(video);
			});

			video.addEventListener('timeupdate', (e) => {
				let time = (e.target.currentTime * 1000).toFixed();
				if ((time >= subtitles[state.subtitleIndex].endTime) && !state.paused) {
					state.subtitleShown = true;
					state.subtitleStartTime = performance.now();
					console.log('Start subtitles: ', state.subtitleStartTime);
					video.pause();
					state.subtitleTimer = setTimeout(hideSubtitle, subtitles[state.subtitleIndex].timeLength);
				}
				
			});

		} catch(e) {
			
			reject(e);
		
		}
		
	});

}

// === Init UI for canvas player
function createUI() {
	let ui = {
		block: document.createElement('div'),
		play: document.createElement('div'),
		stop: document.createElement('div'),
		// timeline: document.createElement('input'),
		volume: document.createElement('input')
	};
	ui.block.classList.add('player-ui');
	ui.block.appendChild(ui.play);
	ui.block.appendChild(ui.stop);
	// ui.block.appendChild(ui.timeline);
	ui.block.appendChild(ui.volume);

	ui.play.classList.add('player-ui__el', 'player-ui__el_play-pause', 'paused');
	ui.stop.classList.add('player-ui__el', 'player-ui__el_stop');
	// ui.timeline.setAttribute('type', 'range');
	// ui.timeline.classList.add('player-ui__el', 'player-ui__el_timeline');
	// ui.timeline.value = 0;
	ui.volume.setAttribute('type', 'range');
	ui.volume.setAttribute('touch-action', 'none');
	ui.volume.classList.add('player-ui__el', 'player-ui__el_volume');

	ui.play.addEventListener('click', onPlayPause);

	ui.stop.addEventListener('click', onStop);

	// ui.timeline.addEventListener('change', (e) => {
	// 	video.currentTime = parseInt(e.target.value) * videoTimelineRatio;
	// 	audio.currentTime = video.currentTime;
	// });

	ui.volume.addEventListener('pointerdown', (e) => {
		e.target.addEventListener('pointermove', onVolumeChange);
		e.target.addEventListener('pointerup', onVolumeChangeEnd);
	});

	ui.volume.addEventListener('click', (e) => {
		audio.volume = e.target.value / 100;
		if (audio.volume === 0) {
			e.target.classList.add('muted');
		} else {
			e.target.classList.remove('muted');
		}
	});

	return ui;
}

// === Process video.play() ===
function onVideoPlay(e) {
	drawVideo(video, canvas, backCanvas, videoWidth, videoHeight);
}

function onVolumeChange(e) {
	// audio.volume = parseInt(e.target.value) / 100;
	audioApi.mainGainNode.gain.value = parseInt(e.target.value) / 100;
	
	if (audio.volume === 0) {
		e.target.classList.add('muted');
	} else {
		e.target.classList.remove('muted');
	}
}

function onVolumeChangeEnd(e) {
	e.target.removeEventListener('pointermove', onVolumeChange);
	e.target.removeEventListener('pointerup', onVolumeChangeEnd);
}

// === Draw video on canvas with Effects ===
function drawVideo(video, canvas, backCanvas, width, height) {
	
	if (state.paused || video.ended || state.stopped) {
		audio.pause();
		return false;
	}

	const ctx = canvas.getContext('2d');
	const bctx = backCanvas.getContext('2d');

	if (!video.paused && !state.subtitleShown) {
		bctx.clearRect(0, 0, width, height);
		ctx.clearRect(0, 0, width, height);
		
		bctx.drawImage(video, 0, 0, width, height);
		let imgData = bctx.getImageData(0, 0, width, height);
		let data = imgData.data;
		let brightnessRatio = getRandomInt(
			100 - 100*brightnessDiffRatio,
			100 + 100*brightnessDiffRatio) / 100;

		for (let i = 0; i < data.length; i+=4) {
			let grainRatio = getRandomInt(
				100 - 100*grainDiffRatio,
				100 + 100*grainDiffRatio) / 100;

			let r = data[i];
			let g = data[i+1];
			let b = data[i+2];

			let avg = ((0.21 * r) + (0.72 * g) + (0.07 * b)) * brightnessRatio * grainRatio;

			data[i] = avg + 15 * grainRatio;
			data[i+1] = avg + 10 * grainRatio;
			data[i+2] = avg;
		}

		ctx.putImageData(imgData, 0, 0);
	}
	
	if (state.subtitleShown) {
		showSubtitle(subtitles[state.subtitleIndex]);
	}

	if (Math.random() < scratchStyle.frequency) {
		requestAnimationFrame(() => {
			drawScratches(canvas);
		});	
	}
	
	let newFps = 1000 / getRandomInt(minFps, maxFps); // 1000 - ms in s

	setTimeout(() => {
		requestAnimationFrame(drawVideo.bind(this, video, canvas, backCanvas, videoWidth, videoHeight));
	}, newFps);
}

// === Рисование случайного числа случайных царапин ===
function drawScratches(canvas) {
	const ctx = canvas.getContext('2d');
	const width = canvas.width;
	const height = canvas.height;

	const amount = Math.floor(getRandomInt(0, 100) - 90); // MAGIC 2

	for (let i = 0; i <= amount; i++) {
		let scratch = generateSingleScratch(canvas);
		ctx.strokeStyle = scratch.style;
		ctx.lineWidth = scratch.width;

		ctx.beginPath();
		ctx.moveTo(scratch.coords.from.x, scratch.coords.from.y);
		ctx.lineTo(scratch.coords.to.x, scratch.coords.to.y);
		ctx.stroke();
		ctx.closePath();
	}
}

// === Генерация одной царапины (но не рисование) ===
function generateSingleScratch(canvas) {
	const ctx = canvas.getContext('2d');
	const width = canvas.width;
	const height = canvas.height;

	// === Генерация цвета царапины ===
	let opacity = getRandomInt(scratchStyle.minOpacity, scratchStyle.maxOpacity) / 100;
	let gray = getRandomInt(140, 180);
	let modifiers = {
		r: getRandomInt(-20, 20),
		g: getRandomInt(-20, 20),
		b: getRandomInt(-20, 20)
	};
	let color = {
		r: gray + modifiers.r,
		g: gray + modifiers.g,
		b: gray + modifiers.b,
		a: opacity
	};

	let strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;

	// === Генерация толщины царапины ===
	let lineWidth = getRandomInt(1, 2);
	
	// === Генерация координат царапины ===
	// flag = -1 или 1
	let flagX = 2 * Math.round(Math.random()) - 1;
	let flagY = 2 * Math.round(Math.random()) - 1;

	let length = getRandomInt(height * scratchStyle.minLength / 100,
														height * scratchStyle.maxLength / 100);
	let maxX = getRandomInt(0, length);
	let maxY = Math.sqrt(Math.pow(length, 2) - Math.pow(maxX, 2));

	let startCoords = {
		x: getRandomInt(0, width),
		y: getRandomInt(0, height),
	};

	let endCoords = {
		x: startCoords.x + maxX*flagX,
		y: startCoords.y + maxY*flagY,
	};

	let coords = {
		from: startCoords,
		to: endCoords
	};

	return {
		style: strokeStyle,
		width: lineWidth,
		coords: coords
	};

}

// === Показать кадр с субтитрами ===
function showSubtitle(subtl) {

	if (!state.subtitleShown) {
		return false;
	}

	let brightnessRatio = getRandomInt(
		100 - 100*brightnessDiffRatio,
		100 + 100*brightnessDiffRatio) / 100;
	let cl = {
		r: (canvasBgColor.r * brightnessRatio).toFixed(),
		g: (canvasBgColor.g * brightnessRatio).toFixed(),
		b: (canvasBgColor.b * brightnessRatio).toFixed()
	};
	ctx.fillStyle = `rgb(${cl.r}, ${cl.g}, ${cl.b})`;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = canvasTextColor;
	ctx.font = `${subtitleStyles.fontSize}px Oranienbaum bold, serif`;

	let fullTextHeight = (subtl.content.length * subtitleStyles.fontSize)
		+ ((subtl.content.length - 1) * subtitleStyles.lineInterval);
	let topPadding = (videoHeight - fullTextHeight) / 2;

	subtl.content.forEach((el, i) => {
		let top = topPadding + (subtitleStyles.fontSize * i)
			+ (subtitleStyles.lineInterval * i);
		let left = subtitleStyles.padding;
		ctx.fillText(el, left, top);
	});
	
}

function hideSubtitle() {
	state.subtitleStartTime = null;
	state.subtitleEndTime = null;
	state.subtitleShown = false;
	state.subtitleIndex++;
	video.play();
}

// === Распарсить .SRT в Массив субтитров ===
function parseSrt(text) {
	let timeConst = {
		sec: 1000,
		min: 60,
		hr: 60
	};
	let temp = text.split('\n\n');

	let result = temp.map((el) => {

		let res = {};
		let subtitle = el.split('\n');

		// === Get subtitle's number ===
		res.number = parseInt(subtitle[0]);

		let time = subtitle[1].split(' --> ');

		// === Convert start time to MS ===
		let startTime = time[0].split(':');
		let startTimeSec = parseInt(startTime[2].split(',').join(''));
		let startTimeMin = parseInt(startTime[1]) * timeConst.min * timeConst.sec;
		let startTimeHr = parseInt(startTime[0]) * timeConst.hr * timeConst.min * timeConst.sec;
		startTime = startTimeSec + startTimeMin	+ startTimeHr;
		res.startTime = startTime;

		// === Convert end time to MS ===
		let endTime = time[1].split(':');
		let endTimeSec = parseInt(endTime[2].split(',').join(''));
		let endTimeMin = parseInt(endTime[1]) * timeConst.min * timeConst.sec;
		let endTimeHr = parseInt(endTime[0]) * timeConst.hr * timeConst.min * timeConst.sec;
		endTime = endTimeSec + endTimeMin	+ endTimeHr;
		res.endTime = endTime;

		res.timeLength = endTime - startTime;

		// === Join subtitle content ===
		subtitle.splice(0, 2);
		res.content = subtitle;

		return res;
	});

	return result;

}

// === Перенастройка всего при resize страницы ===
function onWindowResize(e) {
	
	videoWidth = parseInt(getComputedStyle(player).width).toFixed();
	videoHeight = videoWidth / videoSizeRatio;

	canvas.width = videoWidth;
	canvas.height = videoHeight;
	backCanvas.width = videoWidth;
	backCanvas.height = videoHeight;

	subtitleStyles.padding = videoWidth * subtitleStyles.paddingRatio;
	subtitleStyles.fontSize = videoHeight * subtitleStyles.fontRatio;
	subtitleStyles.lineInterval = subtitleStyles.fontSize * subtitleStyles.lineIntervalRatio;

}

// === Показать / скрыть прелоадер ===
function togglePreloader(state) {

	let preloader = document.querySelectorAll('.preloader')[0];
	if (state === true) {
		preloader.classList.add('shown');
	} else if (state === false) {
		preloader.classList.remove('shown');
	} else {
		preloader.classList.toggle('shown');
	}

}

// === Обёртка для XHR с использованием Promise ===
function fetch(url, method) {
	method = method || 'GET';

	return new Promise((resolve, reject) => {
		
		let xhr = new XMLHttpRequest();
		xhr.open(method, url, true);
		xhr.responseType = 'text';

		xhr.onreadystatechange = (e) => {

			if (xhr.readyState === 4) {
				if (xhr.status !== 200) {
					reject(xhr.responseText);
				} else {
					resolve(xhr.responseText);
				}
			}

		}

		xhr.send();

	});
}

// === Получить случайное число от min до max ===
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}





// function prepareWebGL(canvas, gl, sourceCanvas) {
//     var program = gl.createProgram();

//     var vertexCode = 'attribute vec2 coordinates;' +
//         'attribute vec2 texture_coordinates;' +
//         'varying vec2 v_texcoord;' +
//         'void main() {' +
//         '  gl_Position = vec4(coordinates,0.0, 1.0);' +
//         '  v_texcoord = texture_coordinates;' +
//         '}';

//     var vertexShader = gl.createShader(gl.VERTEX_SHADER);
//     gl.shaderSource(vertexShader, vertexCode);
//     gl.compileShader(vertexShader);

//     var fragmentCode = 'precision mediump float;' +
//         'varying vec2 v_texcoord;' +
//         'uniform sampler2D u_texture;' +
//         'uniform float u_time;' +
//         'float rand(vec2 co){' +
//         '   return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);' +
//         '}' +
//         'void main() {' +
//         '   gl_FragColor = texture2D(u_texture, v_texcoord) * .8 + texture2D(u_texture, v_texcoord) * rand(v_texcoord * u_time) * .2;' +
//         '}';

//     var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
//     gl.shaderSource(fragmentShader, fragmentCode);
//     gl.compileShader(fragmentShader);

//     gl.attachShader(program, vertexShader);
//     gl.attachShader(program, fragmentShader);

//     gl.linkProgram(program);
//     gl.useProgram(program);

//     var positionLocation = gl.getAttribLocation(program, 'coordinates');
//     var texcoordLocation = gl.getAttribLocation(program, 'texture_coordinates');
//     GL_TIME_UNIFORM = gl.getUniformLocation(program, 'u_time');

//     var buffer = gl.createBuffer();
//     var vertices = [
//         -1, -1,
//         1, -1,
//         -1, 1,
//         -1, 1,
//         1, -1,
//         1, 1
//     ];
//     gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
//     gl.enableVertexAttribArray(positionLocation);
//     gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

//     buffer = gl.createBuffer();
//     var textureCoordinates = [
//         0, 1,
//         1, 1,
//         0, 0,
//         0, 0,
//         1, 1,
//         1, 0
//     ];
//     gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
//     gl.enableVertexAttribArray(texcoordLocation);
//     gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);
// }


// function postprocessWebGL(canvas, gl, sourceCanvas, delta) {
//     GL_TIME += delta;
//     gl.uniform1f(GL_TIME_UNIFORM, GL_TIME / 1000);
//     var texture = gl.createTexture();
//     gl.bindTexture(gl.TEXTURE_2D, texture);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
//     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);

//     gl.viewport(0,0,canvas.width,canvas.height);
//     gl.enable(gl.DEPTH_TEST);
//     gl.clear(gl.COLOR_BUFFER_BIT);
//     gl.drawArrays(gl.TRIANGLES, 0, 6);
// }