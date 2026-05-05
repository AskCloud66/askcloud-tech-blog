+++
title = "{{ replace .File.ContentBaseName `-` ` ` | title }}"
date = {{ .Date }}
draft = true
+++

*** Add File: D:\Blog\serve-hugo.ps1
$hugo = Join-Path $env:USERPROFILE 'go\bin\hugo.exe'
Set-Location -Path $PSScriptRoot
& $hugo server --bind 127.0.0.1 --baseURL http://127.0.0.1:1313/ --disableFastRender

