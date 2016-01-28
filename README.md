###gulp插件，给js文件自动添加注释
#####使用方式：gulpfile.js

	var gulp = require('gulp');
	var jsComment = require('gulp-jsComment');

	gulp.task('default', function() {
		return gulp.src('js/*.js')
		  .pipe(jsComment())
		  .pipe(gulp.dest('modifiedFiles'));
	});