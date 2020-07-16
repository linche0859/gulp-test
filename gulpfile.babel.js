import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import sass from 'gulp-sass';
import nodeSass from 'node-sass';
import babel from 'gulp-babel';
import concat from 'gulp-concat';
import uglify from 'gulp-uglify';
import del from 'del';
import browserSync from 'browser-sync';
import ghPages from 'gulp-gh-pages';
import plumber from 'gulp-plumber';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';

const paths = {
  html: {
    src: './src/**/*.html',
    dest: 'dist/',
  },
  styles: {
    src: './src/scss/**/*.scss',
    dest: 'dist/styles/',
  },
  scripts: {
    src: './src/scripts/**/*.js',
    dest: 'dist/scripts/',
  },
};

sass.compiler = nodeSass;

export const clean = () => del(['dist']);

function copyHTML() {
  return gulp
    .src(paths.html.src)
    .pipe(gulp.dest(paths.html.dest))
    .pipe(browserSync.stream());
}

export function styles() {
  const plugins = [autoprefixer()];
  return (
    gulp
      .src(paths.styles.src)
      .pipe(plumber())
      .pipe(sourcemaps.init())
      .pipe(sass().on('error', sass.logError))
      // 這時已經編譯好 css
      .pipe(postcss(plugins))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(paths.styles.dest))
      .pipe(browserSync.stream())
  );
}

export function scripts() {
  return gulp
    .src(paths.scripts.src, { sourcemaps: true })
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ['@babel/env'],
      })
    )
    .pipe(uglify())
    .pipe(concat('all.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(browserSync.stream());
}

export function browser() {
  browserSync.init({
    server: {
      baseDir: './dist/',
    },
    port: 8082,
  });
}

export function watchFiles() {
  gulp.watch(paths.html.src, copyHTML);
  gulp.watch(paths.scripts.src, scripts);
  gulp.watch(paths.styles.src, styles);
}

export function deploy() {
  return gulp.src('./dist/**/*').pipe(ghPages());
}

const build = gulp.series(
  clean,
  copyHTML,
  styles,
  scripts,
  gulp.parallel(browser, watchFiles)
);

export default build;
