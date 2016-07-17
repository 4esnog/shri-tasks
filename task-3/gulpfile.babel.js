import gulp from 'gulp';
import concat from 'gulp-concat';
import postcss from 'gulp-postcss';
import sourcemaps from 'gulp-sourcemaps';
import uglify from 'gulp-uglify';
import plumber from 'gulp-plumber';

import cssImport from 'postcss-import';
import size from 'postcss-size';
import uncss from 'postcss-uncss';
import cssnext from 'postcss-cssnext';
import mqpacker from 'css-mqpacker';
import cssnano from 'cssnano';
import stylelint from 'stylelint';
// import sugarss from 'sugarss';

import eslint from 'eslint';
import babel from 'gulp-babel';
import bs from 'browser-sync';


gulp.task('html', () => {
	return gulp.src('src/**/*.html')
	.pipe(plumber())
	.pipe(gulp.dest('public/'))
	.pipe(bs.stream());
});

gulp.task('css', () => {

	const processors = [
		cssImport({
			plugins: [
				uncss({
					html: ['src/**/*.html']
				})
			]
		}),
		cssnext({
     	autoprefixer: ['ie >= 10', '> 2% in RU']
  	}),
		size,
		mqpacker,
		cssnano({
			autoprefixer: false
		})
	];

	return gulp.src('src/**/*.css')
	.pipe(plumber())
	.pipe(sourcemaps.init())
	.pipe(postcss(processors))
	.pipe(sourcemaps.write('.'))
	.pipe(gulp.dest('public/'))
	.pipe(bs.stream());
});

gulp.task('js', () => {
	return gulp.src('src/**/*.js')
	.pipe(plumber())
	.pipe(sourcemaps.init())
	.pipe(babel({
		presets: ['es2015']
	}))
	.pipe(uglify())
	.pipe(concat('index.js'))
	.pipe(sourcemaps.write('.'))
	.pipe(gulp.dest('public/js/'))
	.pipe(bs.stream());
});

gulp.task('watch', () => {
	gulp.watch('src/**/*.html', gulp.series('html'));
	gulp.watch('src/**/*.css', gulp.series('css'));
	gulp.watch('src/**/*.js', gulp.series('js'));
});

gulp.task('server', () => {
	return bs.init({
		server: 'public/',
		open: true
	})
});

gulp.task('default', gulp.series('html', 'css', 'js', gulp.parallel('server', 'watch')));