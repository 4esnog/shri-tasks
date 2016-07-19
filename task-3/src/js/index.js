'use strict';

// import srt from 'srt.js';

const urls = {
	video: 'https://cache-default04g.cdn.yandex.net/kp.cdn.yandex.net/502838/kinopoisk.ru-Sherlock-284167.mp4',
	videoLocal: '../assets/kinopoisk.ru-Sherlock-284167.mp4',

	audio: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/The_Entertainer_-_1902_-_By_Scott_Joplin.ogg',
	audioLocal: '../assets/The_Entertainer_-_1902_-_By_Scott_Joplin.ogg',

	srt: 'https://raw.githubusercontent.com/shri-msk-2016/dz-multimedia/master/subs.srt',
	srtLocal: '../assets/subs.srt'
};

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
// === END НАСТРОЙКИ ===


let state = {
	subtitleShown: false,
	subtitleIndex: 0,
	mediaLoad: 0,
	paused: true
};

let	videoWidth,
		videoHeight,
		videoSizeRatio,
		videoTimelineRatio,
		video,
		audio,
		subtitles;


// === Set initial event handlers ===
magicButton.addEventListener('click', onMagicButtonClick);
videoInput.addEventListener('change', onInputChange.bind(this, 'video'));
audioInput.addEventListener('change', onInputChange.bind(this, 'audio'));
subtitlesInput.addEventListener('change', onInputChange.bind(this, 'subtitles'));
canvas.addEventListener('click', onPlayPause);
window.addEventListener('resize', onWindowResize);


// === Helpers ===

// === Handle "Maigc" button click ===
function onMagicButtonClick(e) {
	e.preventDefault();

	if (state.mediaLoad < 5) {
		alert('Вы что-то забыли :)');
		return;

	} else if (state.mediaLoad < 6) {
		setTimeout(onMagicButtonClick.bind(this, e), 400);
		document.querySelector('#popup .popup').style.opacity = '0.5';
		return;

	}
	player.appendChild(canvas);

	canvas.width = videoWidth;
	canvas.height = videoHeight;

	backCanvas.width = videoWidth;
	backCanvas.height = videoHeight;
	ctx.fillStyle = canvasBgColor;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	player.appendChild(ui.block);

	document.querySelector('#popup').remove();
}

function onPlayPause(e) {
	if (video.paused || video.ended) {
		state.paused = false;
		video.play();
		audio.play();
		ui.play.classList.remove('paused');
	} else {
		state.paused = true;
		video.pause();
		audio.pause();
		ui.play.classList.add('paused');
	}
}


// === Process input ===
function onInputChange(type, e) {
	
	let reader = new FileReader();

	if (type === 'subtitles') {
		reader.readAsText(e.target.files[0]);
		state.mediaLoad++;
		reader.onloadend = (e) => {		
			subtitles = parseSrt(reader.result);
			state.mediaLoad++;
		}

	} else if (type === 'audio') {
		reader.readAsDataURL(e.target.files[0]);
		state.mediaLoad++;
		reader.onloadend = (e) => {		
			audio = createAudio(reader.result);
			state.mediaLoad++;
		}

	} else if (type === 'video') {
		reader.readAsDataURL(e.target.files[0]);
		state.mediaLoad++;
		reader.onloadend = (e) => {		
			video = createVideo(reader.result);
			state.mediaLoad++;
		}

	}

}

// === Process audio from input ===
function createAudio(src) {
	let audio = document.createElement('audio');
	audio.src = src;
	audio.autoplay = false;
	audio.volume = 0.5;

	// audio.addEventListener('canplay', (e) => {
	// 	// console.dir('Загружено');
	// 	let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	// 	let source = audioCtx.createMediaElementSource(audio);
	// 	let leftPan = audioCtx.createStereoPanner();
	// 	leftPan.pan.value = -1;
	// 	// let rightPan = audioCtx.createStereoPanner();
	// 	// rightPan.pan.value = 1;

	// 	let gainNode = audioCtx.createGain();

		
	// 	source.connect(gainNode);
	// 	// source.connect(rightPan);
	// 	// leftPan.connect(gainNode);
	// 	gainNode.connect(audioCtx.destination);

	// 	// source.connect(audioCtx.destination);
	// });
	

	return audio;
}

// === Process video from input ===
function createVideo(src) {
	let video = document.createElement('video');
	video.src = src;
	video.autoplay = false;
	video.controls = false;
	video.defaultMuted = true;
	video.style.visibility = 'hidden';

	video.addEventListener('play', onVideoPlay, false);
	
	video.addEventListener('loadeddata', (e) => {
		document.querySelector('body').appendChild(video);
				
		// videoWidth = video.clientWidth;
		// videoHeight = video.clientHeight;
		videoSizeRatio = video.clientWidth / video.clientHeight;
		videoWidth = parseInt(getComputedStyle(player).width).toFixed();
		videoHeight = videoWidth / videoSizeRatio;
		
		video.style.display = 'none';
		videoTimelineRatio = video.duration / 100;

		subtitleStyles.padding = videoWidth * subtitleStyles.paddingRatio;
		subtitleStyles.fontSize = videoHeight * subtitleStyles.fontRatio;
		subtitleStyles.lineInterval = subtitleStyles.fontSize * subtitleStyles.lineIntervalRatio;
		
	});

	video.addEventListener('timeupdate', (e) => {
		let time = (e.target.currentTime * 1000).toFixed();
		if (time >= subtitles[state.subtitleIndex].endTime) {
			state.subtitleShown = true;
			video.pause();
			state.subtitleTimer = setTimeout(hideSubtitle, subtitles[state.subtitleIndex].timeLength);
		}
		
	});

	return video;
}

// === Init UI for canvas player
function createUI() {
	let ui = {
		block: document.createElement('div'),
		play: document.createElement('div'),
		stop: document.createElement('div'),
		timeline: document.createElement('input'),
		volume: document.createElement('input')
	};
	ui.block.classList.add('player-ui');
	ui.block.appendChild(ui.play);
	ui.block.appendChild(ui.stop);
	ui.block.appendChild(ui.timeline);
	ui.block.appendChild(ui.volume);

	ui.play.classList.add('player-ui__el', 'player-ui__el_play-pause', 'paused');
	ui.stop.classList.add('player-ui__el', 'player-ui__el_stop');
	ui.timeline.setAttribute('type', 'range');
	ui.timeline.classList.add('player-ui__el', 'player-ui__el_timeline');
	ui.timeline.value = 0;
	ui.volume.setAttribute('type', 'range');
	ui.volume.setAttribute('touch-action', 'none');
	ui.volume.classList.add('player-ui__el', 'player-ui__el_volume');

	ui.play.addEventListener('click', onPlayPause);

	ui.stop.addEventListener('click', (e) => {
		video.pause();
		// scratches.pause();
		audio.pause();
		video.currentTime = 0;
		audio.currentTime = 0;
		state.subtitleIndex = 0;
		ui.play.classList.add('paused');
		ui.timeline.value = 0;
	});

	ui.timeline.addEventListener('change', (e) => {
		video.currentTime = parseInt(e.target.value) * videoTimelineRatio;
		audio.currentTime = video.currentTime;
	});

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
	audio.play();
}

function onVolumeChange(e) {
	audio.volume = parseInt(e.target.value) / 100;
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
		return false;
	}

	const ctx = canvas.getContext('2d');
	const bctx = backCanvas.getContext('2d');

	// requestAnimationFrame(() => {

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

	// });

	if (Math.random() < scratchStyle.frequency) {
		requestAnimationFrame(() => {
			drawScratches(canvas);
		});	
	}
	
	let newFps = 1000 / getRandomInt(minFps, maxFps); // 1000 - ms in s

	setTimeout(drawVideo, newFps, video, canvas, backCanvas, videoWidth, videoHeight);
}

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

function generateSingleScratch(canvas) {
	const ctx = canvas.getContext('2d');
	const width = canvas.width;
	const height = canvas.height;

	// === Generate strokeStyle ===
	let opacity = getRandomInt(scratchStyle.minOpacity, scratchStyle.maxOpacity) / 100; // MAGIC
	let gray = getRandomInt(140, 180); // MAGIC
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

	// === Generate scratch width ===
	let lineWidth = getRandomInt(1, 2);
	
	// === Generate scratch coords ===
	// flag = 0 или 2
	let flagX = 2 * Math.round(Math.random());
	let flagY = 2 * Math.round(Math.random());

	let length = getRandomInt(height * scratchStyle.minLength / 100,
														height * scratchStyle.maxLength / 100);
	let maxX = getRandomInt(0, length);
	let maxY = Math.sqrt(Math.pow(length, 2) - Math.pow(maxX, 2));

	let startCoords = {
		x: getRandomInt(0, width),
		y: getRandomInt(0, height),
	};

	let endCoords = {
		x: startCoords.x + maxX - maxX*flagX,
		y: startCoords.y + maxY - maxY*flagY,
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


function showSubtitle(subtl) {

	if (!state.subtitleShown) {
		console.log('Don\'t show :(');
		return false;
	}

// rgb(16, 17, 16)
	let brightnessRatio = getRandomInt(
		100 - 100*brightnessDiffRatio,
		100 + 100*brightnessDiffRatio) / 100;
	let cl = {
		r: (canvasBgColor.r * brightnessRatio).toFixed(),
		g: (canvasBgColor.g * brightnessRatio).toFixed(),
		b: (canvasBgColor.b * brightnessRatio).toFixed()
	};
	console.dir(cl);
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
	state.subtitleShown = false;
	state.subtitleIndex++;
	video.play();
}

// === Parse .SRT to Array of subtitles ===
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

		// res.content = subtitle.reduce((prev, el, i) => {
		// 	if (i > 1) {
		// 		return prev + el + '\n';
		// 	} else {
		// 		return '';
		// 	}
		// });

		// === Join subtitle content ===
		subtitle.splice(0, 2);
		res.content = subtitle;

		return res;
	});

	return result;

}

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
	// if (state.subtitleShown) {
	// 	showSubtitle(subtitles[state.subtitleIndex]);
	// }

}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}



// TODO CORS xhr
function download(mime, url) {
	// console.log('inside');
	let xhr = new XMLHttpRequest();

	xhr.open('GET', url, true);
	xhr.withCredentials = true;
	xhr.responseTye = 'blob';


	xhr.onload = (e) => {
		if (this.status === 200) {
			let blob = new Blob(
				[this.response],
				{
					type: mime
				}
			);

			// console.dir(blob);

		}
	};

	xhr.send();
}

// loadMedia('video/mp4', urls.video);