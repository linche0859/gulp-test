import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import nodeSass from 'node-sass';
import autoprefixer from 'autoprefixer';
import del from 'del';
import browserSync from 'browser-sync';
import minimist from 'minimist';
// import sourcemaps from 'gulp-sourcemaps';
// import sass from 'gulp-sass';
// import babel from 'gulp-babel';
// import concat from 'gulp-concat';
// import uglify from 'gulp-uglify';
// import ghPages from 'gulp-gh-pages';
// import plumber from 'gulp-plumber';
// import postcss from 'gulp-postcss';

const $ = gulpLoadPlugins();

const envOptions = {
  // 透過「--env 參數」方式，可以將參數帶入 env 的屬性中
  string: 'env',
  // 預設會輸出 develop 字串
  default: {
    env: 'develop',
  },
};

const options = minimist(process.argv.slice(2), envOptions);
//現在開發狀態
console.log(`Current mode：${options.env}`);

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
  images: {
    src: [
      './src/images/**/*.jpg',
      './src/images/**/*.jpeg',
      './src/images/**/*.png',
      './src/images/**/*.gif',
      './src/images/**/*.svg',
    ],
    dest: 'dist/images/',
  },
};

$.sass.compiler = nodeSass;

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
      .pipe($.plumber())
      .pipe($.sourcemaps.init())
      .pipe($.sass().on('error', $.sass.logError))
      // 這時已經編譯好 css
      .pipe($.postcss(plugins))
      .pipe($.if(options.env === 'production', $.cleanCss()))
      .pipe($.sourcemaps.write('./'))
      .pipe(gulp.dest(paths.styles.dest))
      .pipe(browserSync.stream())
  );
}

export function scripts() {
  return gulp
    .src(paths.scripts.src, { sourcemaps: true })
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe(
      $.babel({
        presets: ['@babel/env'],
      })
    )
    .pipe(
      $.if(
        options.env === 'production',
        $.uglify({
          compress: {
            drop_console: true,
          },
        })
      )
    )
    .pipe($.order(['index.js', 'about.js', 'contact.js']))
    .pipe($.concat('all.js'))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(browserSync.stream());
}

export function images() {
  return gulp
    .src(paths.images.src)
    .pipe($.if(options.env === 'production', $.imagemin()))
    .pipe(gulp.dest(paths.images.dest));
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
  return gulp.src('./dist/**/*').pipe($.ghPages());
}

const dev = gulp.series(
  clean,
  images,
  copyHTML,
  styles,
  scripts,
  gulp.parallel(browser, watchFiles)
);

export const build = gulp.series(clean, images, copyHTML, styles, scripts);

export default dev;
