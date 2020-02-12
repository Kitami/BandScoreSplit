# BandScoreSplit  

BandScoreSplit is a tool for dividing band scores(Or orchestra score, etc.) into parts scores. that is built with HTML5 Canvas.  
BandScoreSplitは画像形式のバンドスコア(またはオーケストラスコアなど)をパート譜に抽出するためのツールです。HTML5のCanvasを基づき構築したものです。

only use for  image(JPG,PNG) or PDF files.  
処理できるのは画像（JPG,PNG）とPDF  

Images or PDF files are never transferred to the server, all processing is completed locally.  
画像、PDFファイルはサーバーに転送されることは一切ありません、全部処理はローカルで完結します  

## Using module or sources  
利用している技術またはソース
+ [wellflat/Line Segment Detector(LSD) module (MIT License)](https://github.com/wellflat/imageprocessing-labs/tree/master/cv/lsd)
+ [naptha/tesseract.js](https://github.com/naptha/tesseract.js)
+ [mozilla/pdf.js](https://github.com/mozilla/pdf.js)

## Online demo:  
下記リンクから直接使える  
+ https://kitami.github.io/BandScoreSplit/main.html  

## What can it do  
できること：  
1.Automatically identify staff border  
1.自動的に譜表の外枠を特定  

2.Automatically corrects the tilt of scanned images  
2.スキャンした画像の傾きを自動補正  

3.After trimming once, perform the same trimming process (at the relative position to the staff border) on other images  
3.一度トリミングした後、他の画像に対して同じ(外枠に対する相対位置で)トリミング処理を行う  

4.Automatically output image when paragraph is full  
4.段落がいっぱいになったら自動的に画像を出力する  

## Using Guide  
使い方：   
1.Load an image or PDF file by selecting a file button.  
1.ファイル選択で画像ファイルを読み込ませる  

2.adding a trim box, and adjust the position and height  
2.トリミング枠を追加して、位置と縦幅を調整する  

3.cilck trim button or "subsequent page processing" button, The results will be displayed in the output-area and will be downloaded automatically when one page is done.  
3.トリミングボタン、または「後続ページ処理」ボタンを押す、結果は右側のエリアに表示されて、1ページが使い終わったら自動的ダウンロードされる  

## Questions  
質問  
File an issue:
+ https://github.com/Kitami/BandScoreSplit/issues/new

Follow twitter: @kitami_hi
+ https://twitter.com/kitami_hi
