'use strict';

class UI {
	constructor() {
		this.block = document.createElement('div');
		this.play = document.createElement('div');
		this.stop = document.createElement('div');
		this.volume = document.createElement('input');

		this.block.classList.add('player-ui');
		this.block.appendChild(this.play);
		this.block.appendChild(this.stop);
		this.block.appendChild(this.volume);

		this.play.classList.add('player-ui__el', 'player-ui__el_play-pause', 'paused');
		this.stop.classList.add('player-ui__el', 'player-ui__el_stop');
		this.volume.setAttribute('type', 'range');
		this.volume.setAttribute('touch-action', 'none');
		this.volume.classList.add('player-ui__el', 'player-ui__el_volume');

		this.play.addEventListener('click', onPlayPause);
		this.stop.addEventListener('click', onStop);
		this.volume.addEventListener('pointerdown', (e) => {
			e.target.addEventListener('pointermove', onVolumeChange);
			e.target.addEventListener('pointerup', onVolumeChangeEnd);
		});

		this.volume.addEventListener('click', (e) => {
			audio.volume = e.target.value / 100;
			if (audio.volume === 0) {
				e.target.classList.add('muted');
			} else {
				e.target.classList.remove('muted');
			}
		});
	}

	appendTo(node) {
		node.appendChild(this.block);
	}
}

class Subtitles {
	constructor(text, styles) {
		this.collection = Subtitles.parseSrt(text);
		this.startTime = null;
		this.endTime = null;
		this.shown = false;
		this.index = 0;
		this.timer = 0;
		this.fontRatio = styles.fontRatio;
		this.paddingRatio = styles.paddingRatio;
		this.lineIntervalRatio = styles.lineIntervalRatio;
	}

	// === Парсер субтитров ===
	static parseSrt(text) {
		let timeConst = {
			sec: 1000,
			min: 60,
			hr: 60
		};
		let temp = text.split('\n\n');

		let result = temp.map((el) => {

			let res = {};
			let subtitle = el.split('\n');

			// === Получаем номер куска титров ===
			res.number = parseInt(subtitle[0]);

			let time = subtitle[1].split(' --> ');

			// === Преобразуем время начала показа куска субтитров в MS ===
			let startTime = time[0].split(':');
			let startTimeSec = parseInt(startTime[2].split(',').join(''));
			let startTimeMin = parseInt(startTime[1]) * timeConst.min * timeConst.sec;
			let startTimeHr = parseInt(startTime[0]) * timeConst.hr * timeConst.min * timeConst.sec;
			startTime = startTimeSec + startTimeMin	+ startTimeHr;
			res.startTime = startTime;

			// === Преобразуем время конца показа куска субтитров в MS ===
			let endTime = time[1].split(':');
			let endTimeSec = parseInt(endTime[2].split(',').join(''));
			let endTimeMin = parseInt(endTime[1]) * timeConst.min * timeConst.sec;
			let endTimeHr = parseInt(endTime[0]) * timeConst.hr * timeConst.min * timeConst.sec;
			endTime = endTimeSec + endTimeMin	+ endTimeHr;
			res.endTime = endTime;

			res.timeLength = endTime - startTime;

			// === Готовим основной контент субтитров ===
			subtitle.splice(0, 2);
			res.content = subtitle;

			return res;
		});

		return result;
	}

	// === Показ кадра с субтитрами ===
	show(subtl) {
		if (!this.shown) {
			return false;
		}

		// === Случайная яркость кадра (как для кадра видео) ===
		let brightnessRatio = getRandomInt(
			100 - 100*brightnessDiffRatio,
			100 + 100*brightnessDiffRatio) / 100;
		let cl = {
			r: (canvasBgColor.r * brightnessRatio).toFixed(),
			g: (canvasBgColor.g * brightnessRatio).toFixed(),
			b: (canvasBgColor.b * brightnessRatio).toFixed()
		};
		// === Рисуем фон ===
		ctx.fillStyle = `rgb(${cl.r}, ${cl.g}, ${cl.b})`;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// === Готовим текст ===
		ctx.fillStyle = canvasTextColor;
		ctx.font = `${this.fontSize}px \'Oranienbaum\'`;

		// === Считаем, где рисовать ===
		let fullTextHeight = (subtl.content.length * this.fontSize)
			+ ((subtl.content.length - 1) * this.lineInterval);
		let topPadding = (videoHeight - fullTextHeight) / 2;

		// === Рисуем текст построчно ===
		subtl.content.forEach((el, i) => {
			let top = topPadding + (this.fontSize * i)
				+ (this.lineInterval * i);
			let left = this.padding;
			ctx.fillText(el, left, top);
			
		});
	}

	hide() {
		this.startTime = null;
		this.endTime = null;
		this.shown = false;
		this.index++;
		video.play();
	}

}

// === Получаем уже присутствующие узлы DOM ===
const magicButton = document.getElementById('magic-button');
const videoInput = document.getElementById('video');
const audioInput = document.getElementById('audio');
const subtitlesInput = document.getElementById('subtitles');
const player = document.getElementById('player');
const scratches = document.getElementById('scratches');

// === Инициализируем основной и вспомогательный canvas ===
const backCanvas = document.createElement('canvas');
const canvas = document.createElement('canvas');
backCanvas.setAttribute('crossorigin', 'anonymus');
canvas.setAttribute('crossorigin', 'anonymus');
const	ctx = canvas.getContext('2d');

const ui = new UI();


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
const brightnessDiffRatio = 0.3;   // Коэффициент разброса яркости кадров
const grainDiffRatio = 0.15;       // Коэффициент зернистости (шума)
const minFps = 20;
const maxFps = 40;
const scratchStyle = {
	minLength: 5,										 // Длина и прозрачность царапин,
	maxLength: 20,   								 // в % от высоты видео (от 0 до 100)
	minOpacity: 30,  								 // 0 .. 100
	maxOpacity: 90,  								 // 0 .. 100
	frequency: 0.75, 								 // 0 .. 1
}
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


// === Первоначальные обработчики ===
magicButton.addEventListener('click', onMagicButtonClick);
canvas.addEventListener('click', onPlayPause);
window.addEventListener('resize', onWindowResize);



// === Начинаем магию по клику кнопки "Заглушить" ===
function onMagicButtonClick(e) {
	
	e.preventDefault();
	togglePreloader(true);
	
	// === Асинхронно грузим видео, аудио и субтитры ===
	Promise.all([
		createVideo('http://cors.io/?u=' + videoInput.value),
		createAudio('http://cors.io/?u=' + audioInput.value),
		fetch(subtitlesInput.value, 'GET')
	]).then(res => {

		// === Настраиваем canvas ===
		canvas.width = videoWidth;
		canvas.height = videoHeight;
		backCanvas.width = videoWidth;
		backCanvas.height = videoHeight;

		ctx.fillStyle = canvasBgColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
		// === Добавляем UI и canvas на плеер ===
		ui.appendTo(player);
		player.appendChild(canvas);

		video = res[0];
		audio = res[1];
		subtitles = new Subtitles(res[2], subtitleStyles);

		// === Рассчитываем размеры и отступы для показа субтитров ===
		subtitles.padding = videoWidth * subtitles.paddingRatio;
		subtitles.fontSize = (videoHeight * subtitles.fontRatio).toFixed();
		subtitles.lineInterval = subtitles.fontSize * subtitles.lineIntervalRatio;

		document.querySelector('#popup').remove();
		togglePreloader(false);

	}).catch(err => {
		console.dir(err);
	});

}

// === Обработка паузы / запуска видео ===
function onPlayPause(e) {
	if (state.paused || video.ended) {
		state.paused = false;
		state.stopped = false;
		audio.play();
    scratches.play();

		if (subtitles.shown) {
			drawVideo(video, canvas, backCanvas, videoWidth, videoHeight);
			subtitles.timer = setTimeout(
				() => {subtitles.hide()},
				subtitles.collection[subtitles.index].timeLength
			);
		} else {
			video.play();
		}

		audioApi.mainGainNode.connect(audioApi.ctx.destination);
		ui.play.classList.remove('paused');

	} else {
		state.paused = true;

		if (subtitles.shown) {
			clearTimeout(subtitles.timer);
			subtitles.endTime = performance.now();
			subtitles.shownTime = (subtitles.endTime - subtitles.startTime).toFixed();
			subtitles.restTime = subtitles.collection[subtitles.index].timeLength - subtitles.shownTime;
		}

		video.pause();
    scratches.pause();
		audio.pause();
		audioApi.mainGainNode.disconnect();
		ui.play.classList.add('paused');
	}
}

// === Обработка нажатия кнопки "стоп" ===
function onStop(e) {
		state.stopped = true;
		clearTimeout(subtitles.timer);
		video.pause();
    scratches.pause();
		audio.pause();
		audioApi.mainGainNode.disconnect();
		video.currentTime = 0;
		audio.currentTime = 0;
		subtitles.index = 0;
		ui.play.classList.add('paused');
	}

// === Загрузка и настройка аудио ===
function createAudio(src) {
	return new Promise((resolve, reject) => {
		try {
			let audio = document.createElement('audio');
			audio.setAttribute('crossorigin', 'anonymus');
			audio.src = src;
			audio.autoplay = false;
			audio.addEventListener('loadeddata', (e) => {

				// === Добавляем шумы к видео, используя Web Audio API ===
				audioApi.ctx = new (window.AudioContext || window.webkitAudioContext)();
				audioApi.source = audioApi.ctx.createMediaElementSource(audio);
				audioApi.mainGainNode = audioApi.ctx.createGain();
				audioApi.mainGainNode.gain.value = 0.5;

				audioApi.whiteNoise = audioApi.ctx.createScriptProcessor(audioBufferSize / 2, 1, 1);

				audioApi.whiteNoise.onaudioprocess = function(e) {

					for (let ch = 0; ch < e.outputBuffer.numberOfChannels; ch++) {
						let inputData = e.inputBuffer.getChannelData(ch);
						let outputData = e.outputBuffer.getChannelData(ch);	

						for (let i = 0; i < e.inputBuffer.length; i++) {
							let white = Math.random() * 2 - 1;
							outputData[i] = inputData[i] + white * 0.08;
						}
					}

				}

				audioApi.source.connect(audioApi.mainGainNode);
				audioApi.whiteNoise.connect(audioApi.mainGainNode);

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

// === Загрузка и настройка видео ===
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
				
				resolve(video);
			});

			// === Обработчик timeupdate проверяет, нужно ли рисовать субтитры ===
			video.addEventListener('timeupdate', (e) => {
				let time = (e.target.currentTime * 1000).toFixed();
				if ((time >= subtitles.collection[subtitles.index].endTime)
					  && !state.paused
					  && !subtitles.shown) {

					video.pause();
					subtitles.shown = true;
					subtitles.startTime = performance.now();
					subtitles.timer = setTimeout(() => {subtitles.hide()}, subtitles.collection[subtitles.index].timeLength);
					
				}
			});

		} catch(e) {
			
			reject(e);
		
		}
	});
}


// === Запускаем отрисовку видео на canvas ===
function onVideoPlay(e) {
	drawVideo(video, canvas, backCanvas, videoWidth, videoHeight);
}

function onVolumeChange(e) {
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

	// === Обработка и рисование видео ===
	if (!video.paused && !subtitles.shown) {
		
		// === Чистим холсты ===
		bctx.clearRect(0, 0, width, height);
		ctx.clearRect(0, 0, width, height);

    // === Случайная яркость кадра ===
    let brightnessRatio = getRandomInt(
      100 - 100*brightnessDiffRatio,
      100 + 100*brightnessDiffRatio) / 100;
    let cl = {
      r: (210 * brightnessRatio).toFixed(),
      g: (210 * brightnessRatio).toFixed(),
      b: (200 * brightnessRatio).toFixed()
    };

    // === Обрабатываем кадры на вспомагательном canvas ===
    bctx.fillStyle = `rgb(${cl.r}, ${cl.g}, ${cl.b})`;
    bctx.drawImage(video, 0, 0, width, height);
    bctx.globalCompositeOperation = 'color';
    bctx.fillRect(0, 0, width, height);
    bctx.globalCompositeOperation = 'exclusion';
    bctx.drawImage(scratches, 0, 0, width, height);

		// === Обработанное изображение рисуем на видимый canvas ===
    ctx.drawImage(backCanvas, 0, 0, width, height);
	}
	
	// === Рисуем субтитры ===
	if (subtitles.shown) {
		subtitles.show(subtitles.collection[subtitles.index]);
	}

	// === Добавляем царапины ===
	if (Math.random() < scratchStyle.frequency) {
		requestAnimationFrame(() => {
			drawScratches(canvas);
		});	
	}
	
	// === Имитируем плавающий FPS, будто плёнка прокручивается руками ===
	let newFps = 1000 / getRandomInt(minFps, maxFps); // 1000 - ms in s

	setTimeout(() => {
		requestAnimationFrame(() => {
			drawVideo(video, canvas, backCanvas, videoWidth, videoHeight)
		});
	}, newFps);
}

// === Рисование случайного числа случайных царапин ===
function drawScratches(canvas) {
	const ctx = canvas.getContext('2d');
	const width = canvas.width;
	const height = canvas.height;

	// === Случайное количество царапин ===
	const amount = Math.floor(getRandomInt(0, 100) - 90);

	for (let i = 0; i <= amount; i++) {
		let scratch = generateSingleScratch(canvas);
		ctx.strokeStyle = scratch.style;
		ctx.lineWidth = scratch.width;

		// === Рисование царапины ===
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

	// === Длина царапины ===
	let length = getRandomInt(height * scratchStyle.minLength / 100,
		height * scratchStyle.maxLength / 100);
	// === Координаты царапины ===
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

// === Перенастройка всего при resize страницы ===
function onWindowResize(e) {
	
	// === Считаем новые размеры canvas ===
	videoWidth = parseInt(getComputedStyle(player).width).toFixed();
	videoHeight = videoWidth / videoSizeRatio;

	// === Меняем размеры canvas ===
	canvas.width = videoWidth;
	canvas.height = videoHeight;
	backCanvas.width = videoWidth;
	backCanvas.height = videoHeight;

	// === Считаем новые размеры и отступы для субтитров ===
	subtitles.padding = videoWidth * subtitles.paddingRatio;
	subtitles.fontSize = (videoHeight * subtitles.fontRatio).toFixed();
	subtitles.lineInterval = subtitles.fontSize * subtitles.lineIntervalRatio;

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