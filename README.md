# BandScoreSplit  

BandScoreSplit is a tool for dividing band scores(Or orchestra score, etc.) into parts scores. that is built with HTML5 Canvas. only use for image(JPG,PNG) or PDF files. Images or PDF files are never transferred to the server, all processing is completed locally.  

BandScoreSplitは画像形式のバンドスコア(またはオーケストラスコアなど)をパート譜に抽出するためのツールです。HTML5のCanvasを使用して構築したものです。処理できるのは画像（JPG,PNG）とPDF、画像、PDFファイルはサーバーに転送されることはありません、全部処理はローカルで完結します。  

## Using module or sources  
利用しているモジュール
+ [wellflat/Line Segment Detector(LSD) module (MIT License)](https://github.com/wellflat/imageprocessing-labs/tree/master/cv/lsd)
+ [naptha/tesseract.js](https://github.com/naptha/tesseract.js)
+ [mozilla/pdf.js](https://github.com/mozilla/pdf.js)

## Online demo:  
+ https://kitami.github.io/BandScoreSplit/main.html  

## What can it do  
1.Automatically identify staff border  
2.Automatically corrects the tilt of scanned images  
3.After trimming once, perform the same trimming process (at the relative position to the staff border) on other images  
4.Automatically output image when page is full  
5.OCR the instrument name on left   

できること：  
1.自動的に譜表の外枠を特定  
2.スキャンした画像の傾きを自動補正  
3.一度トリミングした後、他の画像に対して同じ(外枠に対する相対位置で)トリミング処理を行う  
4.ページがいっぱいになったら自動的に画像を出力する  
5.ガイド線左側の楽器名に対してOCR（文字認識）を行う  

## Using Guide  
使い方：   
1.Load an image or PDF file by selecting a file button.  
2.adding a trim box, and adjust the position and height (you can use OCR button to locate it accurately)  
3.cilck trim button or "subsequent page processing" button, The results will be displayed in the output-area and will be downloaded automatically when one page is done.  

1.ファイル選択で画像ファイルを読み込ませる  
2.トリミング枠を追加して、位置と縦幅を調整する (OCRを実行すると結果は位置特定に使える)  
3.トリミングボタン、または「後続ページ処理」ボタンを押す、結果は右側のエリアに表示されて、1ページが使い終わったら自動的ダウンロードされる  


## Questions  
質問  
File an issue:
+ https://github.com/Kitami/BandScoreSplit/issues/new

Follow twitter: @kitami_hi
+ https://twitter.com/kitami_hi
