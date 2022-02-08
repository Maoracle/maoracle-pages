/**
 * 脚手架实现过程
 */

const path = require('path')
// 文件删除模块
const del = require('del')

// 服务器模块
const browserSync = require('browser-sync')

// 实现这个项目的构建任务
const { src, dest, series, parallel, watch} = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins')

const bs = browserSync.create();

const gulpPlugins = gulpLoadPlugins();

const pwd = process.pwd();

// 默认配置
const config = {
 build: {
   dist: 'dist',
   src: 'src',
   temp: 'temp',
   public: 'public',
   paths: {
     styles: 'assets/styles/*.scss',
     scripts: 'assets/scripts/*.js',
     html: '*.html',
     images: 'assets/images/**',
     fonts: 'assets/fonts/**'
   }
 }
}

try {
 const loadConfig = require(path.join(__dirname, 'pages.config.js'))
 config = Object.assign({}, config, loadConfig)
} catch (error) {
 throw error;
}
const clean = () => {
 return del([config.build.dist, config.build.temp])
}

const style = () => {
 // 设置base可以将转换文件的文件结构也拷贝到目标路径
 return src(config.build.paths.styles, {base: config.build.src, cwd: config.build.src})
           .pipe(gulpPlugins.sass({ outputStyle: 'expand'}))
           .pipe(dest(config.build.temp))
}

const script = () => {
 return src(config.build.paths.scripts,{base: config.build.src, cwd: config.build.src})
           .pipe(gulpPlugins.babel({presets: require('@babel/preset-env')})) // require导入babel preset，构建工具可以自动查找Babel模块
           .pipe(dest(config.build.temp))
}

const page = () => {
 return src(config.build.paths.html, {base: config.build.src, cwd: config.build.src})
           .pipe(gulpPlugins.swig({data}))
           .pipe(dest(config.build.temp))
}

const img = () => {
 return src(config.build.paths.images, {base: config.build.src, cwd: config.build.src})
           .pipe(gulpPlugins.imagemin())
           .pipe(dest(config.build.dist))
}

const font = () => {
 return src(config.build.paths.fonts, {base: config.build.src, cwd: config.build.src})
           .pipe(gulpPlugins.imagemin())
           .pipe(dest(config.build.dist))
}

const extra = () => {
 return src('**',{base: config.build.public, cwd: config.build.public})
           .pipe(dest(config.build.dist))
}

// 自动转换构建注释
const useref = () => {
 return src('**',{base: config.build.temp,cwd: config.build.temp})
           .pipe(gulpPlugins.useref({searchPath: [config.build.temp,'.']})) // 依赖查找目录
           .pipe(gulpPlugins.if(/\.js$/, gulpPlugins.uglify()))
           .pipe(gulpPlugins.if(/\.css$/, gulpPlugins.cleanCss()))
           .pipe(gulpPlugins.if(/\.html$/, gulpPlugins.htmlmin({ collapseWhitespace: true, minifyCSS: true, minifyJS: true })))
           .pipe(dest(config.build.dist))
}

const serve = () => {
 // cwd配置根目录
 watch(config.build.paths.styles, {cwd: config.build.src}, style)
 watch(config.build.paths.scripts, {cwd: config.build.src}, script)
 watch(config.build.paths.html, {cwd: config.build.src}, page)
 watch([
   config.build.paths.images,
   config.build.paths.fonts
 ], {cwd: config.build.src}, bs.reload)
 watch('**', { cwd: config.build.public }, bs.reload)
 
 bs.init({
   server: {
     notify: false, // browserSync的提示，看情况是否需要
     port: '3000', // 端口
     baseDir: [config.build.temp, config.build.src, config.build.public], // 设置服务根路径
     // files: 'dist/**', // 文件监听，文件修改后自动更新页面
     // open: fasle // 默认是true,自动打开浏览器
     // 路由配置
     routes: {
       '/node_modules': 'node_modules'
     }
   }
 })
}

const compile = parallel(style, script, page)
// 先清除包文件，在打包
const build = series(clean, parallel(series(compile, useref), img, font, extra))

const dev = series(compile, serve)

module.exports = {
 clean,
 build,
 dev
}

