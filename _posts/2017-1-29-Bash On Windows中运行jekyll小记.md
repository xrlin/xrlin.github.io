---
layout: post
title: 在WSL(Bash On Windows)中运行jekyll小记
date: 2017-1-29
tags: [jekyll]
---

* 安装`ruby`开发环境和`bundler`；

* 在`Gemfile`中添加`jekyll`，运行`bundle`会自动安装所有依赖，如果在使用`bundle`安装过程中出现`allocat memory`错误，
  可以直接通过`gem install xxx -v '版本号'`进行安装；

* 安装完`jekyll`后通过`jekyll serve`或者`bundle exec jekyll serve`命令启动`jekyll`服务，这时你会发现出现了下面的错误：
  ```
  jekyll 3.4.0 | Error:  Invalid argument - Failed to watch "/mnt/c/Users/xr_li/OneDrive/Projects/xrlin.github.io/.git/hooks": the given event mask contains no legal events; or fd is not an inotify file descriptor.

  ```
  这时通过添加`--force_polling`这个option便可以避免这错误，即运行`jekyll serve --force_polling`命令。
