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


let magicButton = document.getElementById('magic-button');
let videoInput = document.getElementById('video');
let audioInput = document.getElementById('audio');
let subtitlesInput = document.getElementById('subtitles');
let canvas = document.createElement('canvas');
let	ctx = canvas.getContext('2d');
let mediaLoadState = 0;
let subtitleIndex = 0;
let subtitleStyles = {
	fontRatio: 0.055,
	paddingRatio: 0.1,
	lineIntervalRatio: 0.5
};
let	videoWidth,
		videoHeight,
		video,
		audio,
		subtitles;

// === Set initial event handlers ===
magicButton.addEventListener('click', onMagicButtonClick);
videoInput.addEventListener('change', onInputChange.bind(this, 'video'));
audioInput.addEventListener('change', onInputChange.bind(this, 'audio'));
subtitlesInput.addEventListener('change', onInputChange.bind(this, 'subtitles'));
canvas.addEventListener('click', onCanvasClick);


// === Helpers ===

// === Handle "Maigc" button click ===
function onMagicButtonClick(e) {
	e.preventDefault();
	if (mediaLoadState < 3) {
		alert('Вы что-то забыли :)');
		return;

	} else if (mediaLoadState < 6) {
		setTimeout(onMagicButtonClick.bind(this, e), 400);
		document.querySelector('#popup .popup').style.opacity = '0.5';
		return;

	}

	// canvas.style.width = videoWidth;
	// canvas.style.height = videoHeight;
	canvas.width = videoWidth;
	canvas.height = videoHeight;
	// ctx.fillStyle = 'white';
	ctx.font = `${subtitleStyles.fontSize}px Oranienbaum bold, serif`;
	document.querySelector('body').appendChild(canvas);

	document.querySelector('#popup').remove();
}

function onCanvasClick(e) {
	if (video.paused || video.ended) {
		video.play();
		audio.play();
	} else {
		video.pause();
		audio.pause();
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
		video.style.display = 'none';

		subtitleStyles.padding = videoWidth * subtitleStyles.paddingRatio;
		subtitleStyles.fontSize = videoHeight * subtitleStyles.fontRatio;
		subtitleStyles.lineInterval = subtitleStyles.fontSize * subtitleStyles.lineIntervalRatio;
		console.dir(subtitleStyles);
	});

	video.addEventListener('timeupdate', (e) => {
		let time = (e.target.currentTime * 1000).toFixed();
		if (time >= subtitles[subtitleIndex].endTime) {
			console.log( 'Let\'s show subtitles! Time: ' + time );
			showSubtitle(subtitles[subtitleIndex]);
			setTimeout(hideSubtitle, subtitles[subtitleIndex].timeLength);
		}
		
	});

	return video;
}

// === Process video.play() ===
function onVideoPlay(e) {
	drawVideo(video, canvas, videoWidth, videoHeight);
	// video.style.display = 'none';
	audio.play();
}

// === Process video.pause() ===
function onVideoPause(e) {
	// video.pause();
	// audio.pause();
}

// === Draw video on canvas with Effects ===
function drawVideo(video, canvas, width, height) {
	
	if (video.paused || video.ended) {
		return false;
	}

	let ctx = canvas.getContext('2d');

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.drawImage(video, 0, 0, width, height);
	let imgData = ctx.getImageData(0, 0, width, height);
	let data = imgData.data;

	for (let i = 0; i < data.length; i+=4) {
		let r = data[i];
		let g = data[i+1];
		let b = data[i+2];

		let avg = (0.21 * r) + (0.72 * g) + (0.07 * b);

		data[i] = avg;
		data[i+1] = avg;
		data[i+2] = avg;
	}

	ctx.putImageData(imgData, 0, 0);

	setTimeout(drawVideo, 20, video, canvas, width, height);
}

function showSubtitle(subtl) {
	video.pause();
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = 'white';
	let fullTextHeight = (subtl.content.length * subtitleStyles.fontSize)
							 + ((subtl.content.length - 1) * subtitleStyles.lineInterval);
	let topPadding = (videoHeight - fullTextHeight) / 2;
	subtl.content.forEach((el, i) => {
		let top = topPadding + (subtitleStyles.fontSize * i)
							+ (subtitleStyles.lineInterval * i);
		let left = subtitleStyles.padding;
		// console.log(top + '~~~' + left);
		ctx.fillText(el, left, top);
	});
	
}

function hideSubtitle() {

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
		console.dir(res.content);

		return res;
	});

	return result;

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