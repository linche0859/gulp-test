import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import nodeSass from 'node-sass';
import autoprefixer from 'autoprefixer';
import del from 'del';
import browserSync from 'browser-sync';
import minimist from 'minimist';

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
  json: {
    menuSrc: './src/data/menu.json',
    indexSrc: './src/data/index.json',
  },
  html: {
    src: './src/**/*.html',
    ejsSrc: './src/**/*.ejs',
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

export function ejs() {
  return gulp
    .src([paths.html.ejsSrc, paths.html.src])
    .pipe(
      $.data(function (file) {
        const menu = require(paths.json.menuSrc);
        const indexContent = require(paths.json.indexSrc);
        return { menu, indexContent };
      })
    )
    .pipe($.ejs())
    .pipe(gulp.dest(paths.html.dest));
}

export function layoutHTML() {
  return (
    gulp
      .src([paths.html.src, paths.html.ejsSrc])
      .pipe($.plumber())
      .pipe(
        $.data(function (file) {
          const menu = require(paths.json.menuSrc);
          const indexContent = require(paths.json.indexSrc);
          const title = '首頁';
          return { menu, indexContent, title };
        })
      )
      .pipe($.ejs())
      // .pipe($.frontMatter())
      // .pipe(
      //   $.layout((file) => {
      //     return file.frontMatter;
      //   })
      // )
      .pipe(gulp.dest(paths.html.dest))
      .pipe(browserSync.stream())
  );
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
  gulp.watch(paths.html.src, layoutHTML);
  gulp.watch(paths.html.ejsSrc, layoutHTML);
  gulp.watch(paths.scripts.src, scripts);
  gulp.watch(paths.styles.src, styles);
}

export function deploy() {
  return gulp.src('./dist/**/*').pipe($.ghPages());
}

const dev = gulp.series(
  clean,
  images,
  layoutHTML,
  styles,
  scripts,
  gulp.parallel(browser, watchFiles)
);

export const build = gulp.series(clean, images, layoutHTML, styles, scripts);

export default dev;
