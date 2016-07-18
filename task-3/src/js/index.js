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
let magicButton = document.getElementById('magic-button');
let videoInput = document.getElementById('video');
let audioInput = document.getElementById('audio');
let subtitlesInput = document.getElementById('subtitles');
let scratches = document.getElementById('scratches');
let player = document.getElementById('player');

// Init player UI
let ui = createUI();

// Init canvas w/ styles
let backCanvas = document.createElement('canvas');
let canvas = document.createElement('canvas');
let	ctx = canvas.getContext('2d');
let mediaLoadState = 0;
let subtitleIndex = 0;
let bodyStyle = getComputedStyle(document.querySelectorAll('body')[0]);
let bodyPadding = parseInt(bodyStyle.paddingLeft) + parseInt(bodyStyle.paddingRight);
let isSubtitleShown = false;
let canvasBgColor = '#101110';
let canvasTextColor = '#e1e8e2';
let videoBrightness = 2;
let subtitleStyles = {
	fontRatio: 0.055,
	paddingRatio: 0.1,
	lineIntervalRatio: 0.5
};
let	videoWidth,
		videoHeight,
		videoSizeRatio,
		video,
		videoTimelineRatio,
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
	if (mediaLoadState < 5) {
		alert('Вы что-то забыли :)');
		return;

	} else if (mediaLoadState < 6) {
		setTimeout(onMagicButtonClick.bind(this, e), 400);
		document.querySelector('#popup .popup').style.opacity = '0.5';
		return;

	}

	canvas.width = videoWidth;
	canvas.height = videoHeight;
	ctx.fillStyle = canvasBgColor;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	player.appendChild(ui.block);
	player.appendChild(canvas);

	document.querySelector('#popup').remove();
}

function onPlayPause(e) {
	if (video.paused || video.ended) {
		video.play();
		scratches.play();
		audio.play();
		ui.play.classList.remove('paused');
	} else {
		video.pause();
		scratches.pause();
		audio.pause();
		ui.play.classList.add('paused');
	}
}


// === Process input ===
function onInputChange(type, e) {
	
	let reader = new FileReader();

	if (type === 'subtitles') {
		reader.readAsText(e.target.files[0]);
		mediaLoadState++;
		reader.onloadend = (e) => {		
			subtitles = parseSrt(reader.result);
			mediaLoadState++;
		}

	} else if (type === 'audio') {
		reader.readAsDataURL(e.target.files[0]);
		mediaLoadState++;
		reader.onloadend = (e) => {		
			audio = createAudio(reader.result);
			// popup.appendChild(audio);
			// audio.controls = true;
			mediaLoadState++;
		}

	} else if (type === 'video') {
		reader.readAsDataURL(e.target.files[0]);
		mediaLoadState++;
		reader.onloadend = (e) => {		
			video = createVideo(reader.result);
			mediaLoadState++;
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
	video.controls = true;
	video.defaultMuted = true;
	video.style.visibility = 'hidden';

	video.addEventListener('play', onVideoPlay, false);
	video.addEventListener('pause', onVideoPause, false);
	video.addEventListener('loadeddata', (e) => {
		document.querySelector('body').appendChild(video);
		videoWidth = video.clientWidth;
		videoHeight = video.clientHeight;
		videoSizeRatio = videoWidth / videoHeight;
		// console.dir(videoSizeRatio);
		video.style.display = 'none';
		videoTimelineRatio = video.duration / 100;

		subtitleStyles.padding = videoWidth * subtitleStyles.paddingRatio;
		subtitleStyles.fontSize = videoHeight * subtitleStyles.fontRatio;
		subtitleStyles.lineInterval = subtitleStyles.fontSize * subtitleStyles.lineIntervalRatio;
		// console.dir(subtitleStyles);
	});

	video.addEventListener('timeupdate', (e) => {
		let time = (e.target.currentTime * 1000).toFixed();
		if (time >= subtitles[subtitleIndex].endTime) {
			// console.log( 'Let\'s show subtitles! Time: ' + time );
			isSubtitleShown = true;
			showSubtitle(subtitles[subtitleIndex]);
			setTimeout(hideSubtitle, subtitles[subtitleIndex].timeLength);
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
		scratches.pause();
		audio.pause();
		video.currentTime = 0;
		audio.currentTime = 0;
		subtitleIndex = 0;
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
	scratches.play();
	drawVideo(video, scratches, canvas, backCanvas, videoWidth, videoHeight);
	drawScratches(scratches, canvas, videoWidth, videoHeight);
	audio.play();
}

// === Process video.pause() ===
function onVideoPause(e) {
	// video.pause();
	// audio.pause();
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
function drawVideo(video, scratches, canvas, backCanvas, width, height) {
	
	if (video.paused || video.ended) {
		return false;
	}

	let ctx = canvas.getContext('2d');
	// let bctx = backCanvas.getContext('2d');

	// bctx.clearRect(0, 0, backCanvas.width, backCanvas.height);
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	requestAnimationFrame(() => {
		
		ctx.drawImage(video, 0, 0, width, height);
		let imgData = ctx.getImageData(0, 0, width, height);
		let data = imgData.data;

		for (let i = 0; i < data.length; i+=4) {
			let r = data[i];
			let g = data[i+1];
			let b = data[i+2];

			let avg = ((0.21 * r) + (0.72 * g) + (0.07 * b)) * 3;

			data[i] = avg;
			data[i+1] = avg;
			data[i+2] = avg;
		}

		ctx.putImageData(imgData, 0, 0);
		
	});
	

	setTimeout(drawVideo, 20, video, scratches, canvas, backCanvas, videoWidth, videoHeight);
}

function drawScratches(scrchVideo, canvas, width, height) {
	if (scrchVideo.paused || scrchVideo.ended) {
		return false;
	}

	let ctx = canvas.getContext('2d');

	requestAnimationFrame(() => {
		// ctx.clearRect(0, 0, width, height);
		ctx.globalAlpha = 0.2;
		ctx.drawImage(scrchVideo, 0, 0, width, height);
		ctx.globalAplha = 1;
	});

	setTimeout(drawScratches, 20, scrchVideo, canvas, width, height);
}

function showSubtitle(subtl) {

	if (!isSubtitleShown) {
		console.log('Don\'t show :(');
		return false;
	}

	// isSubtitleShown = true;
	video.pause();
	requestAnimationFrame(() => {
		ctx.fillStyle = canvasBgColor;
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
	});

	setTimeout(showSubtitle, 20, subtl);
	
}

function hideSubtitle() {
	isSubtitleShown = false;
	subtitleIndex++;
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
	
	videoWidth = document.documentElement.clientWidth - bodyPadding;
	videoHeight = videoWidth / videoSizeRatio;
	canvas.width = videoWidth;
	canvas.height = videoHeight;
	subtitleStyles.padding = videoWidth * subtitleStyles.paddingRatio;
	subtitleStyles.fontSize = videoHeight * subtitleStyles.fontRatio;
	subtitleStyles.lineInterval = subtitleStyles.fontSize * subtitleStyles.lineIntervalRatio;
	if (isSubtitleShown) {
		showSubtitle(subtitles[subtitleIndex]);
	}

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