var gulp = require('gulp'),
	concat = require('gulp-concat'),
	prefix = require('gulp-autoprefixer'),
	sass = require('gulp-sass'),
	connect = require('gulp-connect'),
	opn = require('opn'),
	uglify = require('gulp-uglify'),
	minifyCss = require('gulp-clean-css'),
	gulpif = require('gulp-if'),
	imagemin = require('gulp-imagemin'),
	newer = require('gulp-newer'),
	maps = require('gulp-sourcemaps'),
	del = require('del'),
	// remember = require('gulp-remember'),
	debug = require('gulp-debug'),
	bs = require('browser-sync'),
	babel = require('gulp-babel');


gulp.task('libs', function(){
	return gulp.src(['bower_components/**/*', 'src/libs/*'])
	.pipe(newer('public/libs/'))
	.pipe(gulpif('*.*(otf|ttf|woff|eot|svg|woff2)', gulp.dest('public/fonts')))
	.pipe(gulp.dest('public/libs/'))
	.pipe(gulp.dest('src/libs/'))
})

gulp.task('fonts', function(){
	return gulp.src('src/fonts/**/*')
		.pipe(gulp.dest('public/fonts/'))
})

gulp.task('images', function(){
	return gulp.src('src/img/**/*')
		.pipe(newer('public/img/'))
		.pipe(imagemin({
			optimizationLevel: 5,
			progressive: true
		}))
		.pipe(gulp.dest('public/img/'));
})

gulp.task('markdown', function(){
	return gulp.src('src/**/*.*(html|json|xml|php|txt)')
		.pipe(gulpif('*.*(json|xml|txt)', gulp.dest('public/')))
		.pipe(gulp.dest('public/'))
})

gulp.task('sass', function(){
	return gulp.src('src/sass/index.sass')
		.pipe(maps.init())
		.pipe(sass().on('error', sass.logError))		
		.pipe(prefix({
			browsers: ['last 5 versions', '> 1%']
		}))
		.pipe(minifyCss({keepSpecialComments: 0}))
		.pipe(maps.write())
		.pipe(gulp.dest('public/css/'))
})

gulp.task('js', function(){
	return gulp.src('src/**!(fonts)/*.js')
	.pipe(newer('public/js/'))
	.pipe(maps.init())
	.pipe(babel({
		presets: ['es2015']
	}))
	.pipe(uglify())
	.pipe(concat('index.js'))
	.pipe(maps.write())
	.pipe(gulp.dest('public/js'))
})

gulp.task('clean', function(){
	return del('public/*')
})


gulp.task('watch', function(){
	gulp.watch('bower_components/**/*', ['libs'])
	gulp.watch('src/**/*.*(html|json|xml|php|txt)', ['markdown'])
	gulp.watch('src/sass/*.sass', ['sass'])
	gulp.watch('src/**/*.js', ['js'])
})

gulp.task('serve', ()=>{
	bs.init({
		server: 'public/',
		// proxy: 'prod.dev/fanhack-new/public/',
		// tunnel: true
	})

	bs.watch('public/**/*').on('change', bs.reload)
})

gulp.task('default', ['images', 'libs', 'fonts', 'js', 'sass', 'markdown', 'serve', 'watch'])

gulp.task('compile', ['clean', 'images', 'libs', 'fonts', 'js', 'sass', 'markdown'])