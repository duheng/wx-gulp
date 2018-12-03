const gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    del = require('del'),
    combiner = require('stream-combiner2'),
    cleancss = require('gulp-clean-css'),
    runSequence = require('run-sequence'),
    sass = require('gulp-sass'),
    path = require('path');

// path


const DIR_INPUT = './src'
const DIR_OUTPUT = './dist'

const JSON_INPUT = `${DIR_INPUT}/**/*.json`
const JS_INPUT = `${DIR_INPUT}/**/*.js`
const WXSS_INPUT =  `${DIR_INPUT}/**/*.{wxss,scss}`
const WXML_INPUT =  `${DIR_INPUT}/**/*.wxml`
const IMAGES_INPUT =  `${DIR_INPUT}/images/**`
// 单元检测错误报告
var colors = $.util.colors;
const handleError = function (err) {
    console.log('\n')
    $.util.log(colors.red('Error!'))
    $.util.log('fileName: ' + colors.red(err.fileName))
    $.util.log('lineNumber: ' + colors.red(err.lineNumber))
    $.util.log('message: ' + err.message)
    $.util.log('plugin: ' + colors.yellow(err.plugin))
};




// ###########################开发环境#############################

// 清除上次任务
gulp.task('clean', () => {
    return del(['./dist/**'])
});


// 监听src目录下所有以下文件
gulp.task('watch', () => {
    gulp.watch(JSON_INPUT, ['json']);
    gulp.watch(IMAGES_INPUT, ['images']);
    gulp.watch(WXML_INPUT, ['wxml']);
    gulp.watch(WXSS_INPUT, ['wxss']);
    gulp.watch(JS_INPUT, ['scripts']);
});

// 检测json格式
gulp.task('jsonLint', () => {
    var combined = combiner.obj([
        gulp.src([JSON_INPUT]),
        $.jsonlint(),
        $.jsonlint.reporter(),
        $.jsonlint.failAfterError()
    ]);

    combined.on('error', handleError);
});

// json
gulp.task('json', ['jsonLint'], () => {
    return gulp.src(JSON_INPUT)
        .pipe(gulp.dest(DIR_OUTPUT))
});



// 第三方
gulp.task('images', () => {
    return gulp.src(IMAGES_INPUT)
        .pipe(gulp.dest('./dist/images'))
});

// 模板
gulp.task('wxml', () => {
    return gulp.src(WXML_INPUT)
        .pipe(gulp.dest(DIR_OUTPUT))
});



// css添加前缀以及重命名
gulp.task('wxss', () => {
    var combined = combiner.obj([
        gulp.src([WXSS_INPUT, '!node_modules/**/*']),
        sass.sync().on('error', sass.logError),
        $.autoprefixer([
            'iOS >= 8',
            'Android >= 4.1'
        ]),
        $.rename((path) => path.extname = '.wxss'),
        gulp.dest(DIR_OUTPUT)
    ]);

    combined.on('error', handleError);
});



// 转换ECMAScript 6 为 ECMAScript5 规则
gulp.task('scripts', () => {
    return gulp.src(JS_INPUT)
        .pipe($.babel({ presets: ['es2015', 'stage-0'] }))
        .pipe(gulp.dest(DIR_OUTPUT))
});



// ###########################上线环境#############################

// json压缩
gulp.task('jsonMin', ['jsonLint'], () => {
    return gulp.src(JSON_INPUT)
        .pipe($.jsonminify2())
        .pipe(gulp.dest(DIR_OUTPUT))
});



// 压缩wxss
gulp.task('wxssMin', () => {
    var combined = combiner.obj([
        gulp.src([WXSS_INPUT, '!node_modules/**/*']),
      //   sass().on('error', sass.logError),
        $.autoprefixer([
            'iOS >= 8',
            'Android >= 4.1'
        ]),
      //  cleancss({ advanced: false,processImport: false,inline: ['remote'] }),
        $.rename((path) => path.extname = '.wxss'),
        gulp.dest(DIR_OUTPUT)

    ]);

    combined.on('error', handleError);
});


// 图片压缩
gulp.task('imagesMin', function () {
    return gulp.src('./src/**/*.{png,jpg,gif,jpeg}')
        .pipe($.imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        }))
        .pipe(gulp.dest(DIR_OUTPUT));
});


// 压缩模板以及wxml系列文件
gulp.task('wxmlMin', () => {
    return gulp.src(WXML_INPUT)
        .pipe($.htmlmin({
            collapseWhitespace: true,
            removeComments: true,
            keepClosingSlash: true
        }))
        .pipe(gulp.dest(DIR_OUTPUT))
});


// uglify压缩规则
gulp.task('scriptMin', () => {
    return gulp.src(JS_INPUT)
        .pipe($.babel({ presets: ['es2015', 'stage-0'] }))
        .pipe($.uglify({
            compress: true,
        }))
        .pipe(gulp.dest(DIR_OUTPUT))
});

// ####################################开发
gulp.task('dev', ['clean'], () => {
    runSequence(
        'json',
        'wxml',
        'scripts',
        'wxss',
        'images',
        'watch');
});

// ###################################上线
gulp.task('build', ['clean'], () => {
    runSequence(
        'jsonMin',
        'wxmlMin',
        'scriptMin',
        'wxssMin',
        'imagesMin');
});



// ###################################清除
gulp.task('pro', ['clean'], () => {
    runSequence('build');
});
