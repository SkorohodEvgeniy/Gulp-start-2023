"use strict";

const { src, dest, watch, parallel, series } = require("gulp");
const gulp = require("gulp");

const autoprefixer = require("gulp-autoprefixer");
const scss = require("gulp-sass")(require("sass"));
const browserSync = require("browser-sync").create();
const uglify = require("gulp-uglify-es").default;
const image = require("gulp-imagemin");
const webp = require("gulp-webp");
const avif = require("gulp-avif");
const del = require("del");
const removeComments = require("gulp-strip-css-comments");
const plumber = require("gulp-plumber");
const panini = require("panini");
const rename = require("gulp-rename");
const cssnano = require("gulp-cssnano");
const notify = require("gulp-notify");

/** Paths */
const appPath = "app/";
const distPath = "dist/";

const browsersync = () => {
  browserSync.init({
    server: {
      baseDir: distPath,
    },
  });
};

const path = {
  build: {
    html: distPath,
    css: distPath + "/css/",
    js: distPath + "/js/",
    img: distPath + "/img/",
    fonts: distPath + "/fonts/",
  },
  src: {
    html: appPath + "*.html",
    css: appPath + "scss/*.scss",
    js: appPath + "js/*.js",
    img:
      appPath +
      "images/**/*.{jpg, png, svg, jpeg, webp, ico, gif, xml, json, webmanifest, avif}",
    fonts: appPath + "fonts/**/*.{eot,woff,woff2,ttf,svg}",
  },
  watch: {
    html: appPath + "**/*.html",
    css: appPath + "scss/**/*.scss",
    js: appPath + "js/**/*.js",
    img:
      appPath +
      "images/**/*.{jpg, png, svg, jpeg, webp, ico, gif, xml, json, webmanifest, avif}",
    fonts: appPath + "fonts/**/*.{eot,woff,woff2,ttf,svg}",
  },
  clean: "./" + distPath,
};

/** Task */

const html = () => {
  panini.refresh();
  return src(path.src.html, { base: appPath })
    .pipe(plumber())
    .pipe(
      panini({
        root: appPath,
        layouts: appPath + "templates/layouts/",
        partials: appPath + "templates/partials/",
      })
    )
    .pipe(dest(path.build.html))
    .pipe(browserSync.stream());
};
const css = () => {
  return src(path.src.css, { base: appPath + "/scss/" })
    .pipe(
      plumber({
        errorHandler: function (err) {
          notify.onError({
            title: "Scss Error",
            message: "Error: <%= error.message %>",
          })(err);
          this.emit("end");
        },
      })
    )
    .pipe(scss())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 10 version"],
        grid: "autoplace",
      })
    )
    .pipe(dest(path.build.css))
    .pipe(
      cssnano({
        zindex: false,
        discardComments: {
          removeAll: true,
        },
      })
    )
    .pipe(removeComments())
    .pipe(
      rename({
        suffix: ".min",
        extname: ".css",
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browserSync.stream());
};

const js = () => {
  return src(path.src.js, { base: appPath + "js/" })
    .pipe(plumber())
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(
      rename({
        suffix: ".min",
        extname: ".js",
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browserSync.stream());
};

const images = () => {
  return src(path.src.img, { base: appPath + "/images/" })
    .pipe(
      image([
        image.mozjpeg({
          quality: 80,
          progressive: true,
        }),
        image.optipng({
          optimizationLevel: 2,
        }),
      ])
    )
    .pipe(dest(path.build.img))
    .pipe(browserSync.stream());
};

const webpImages = () => {
  return src(path.src.img, { base: appPath + "/images/" })
    .pipe(webp())
    .pipe(dest(path.build.img));
};

const avifImages = () => {
  return src(path.src.img, { base: appPath + "/images/" })
    .pipe(avif())
    .pipe(dest(path.build.img));
};

const fonts = () => {
  return src(path.src.fonts, { base: appPath + "/fonts/" }).pipe(
    browserSync.stream()
  );
};

const clean = () => {
  return del(path.clean);
};

const watchFiles = () => {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
  gulp.watch([path.watch.fonts], fonts);
};

const build = gulp.series(
  clean,
  parallel(html, css, js, images, webpImages, avifImages, fonts)
);
const watchs = gulp.parallel(build, watchFiles, browsersync);

exports.html = html;
exports.css = css;
exports.js = js;
exports.images = images;
exports.fonts = fonts;
exports.clean = clean;
exports.build = build;
exports.watchs = watchs;
exports.default = watchs;
