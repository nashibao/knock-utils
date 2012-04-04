# nashibao_ko_utils
### 目的
knockoutの手が届いていないまわりを補完する目的．
主にajaxでの通信からオブジェクトのマッピングを行う．

### 概要
 - utils.model  
 server側のprimarykeyでunique制約．
 - utils.api  
 utils.model.Model継承モデルに自動的にマッピングしたり、
 キャッシュはずしたり、encodeURIしたりするGetとPostのutil.
 - utils.router  
 - (ついで：utils.date)
 
### 例
##### utils.model
	class app.model.Company extends utils.model.Model
		constructor: () ->
			super()
			@name = ko.observable("")
			@board = ko.observable("")
		map: (fields, param) ->
			@name(fields.name)


リレーションマッピング(現状ほぼ手動)


	class app.model.Board extends utils.model.Model
		constructor: () ->
			super()
			@company = ko.observable("")
		map: (fields, param) ->
			@company(utils.model.get(fields.company, app.model.Company))
			# 逆リレーション
			@company().board(@)


#### utils.api

utils.api.get(url, params, callback)

params = {"key":{class:kls,target:tgt}

urlから取ってきたjsonからkey部分を引きぬいてモデルクラスklsにマッピングしてko.observableArrayであるtgtに
突っ込んでます．tgtをko.observable()に要対応．


	utils.api.get "http://hogehoge",
		{"boards":{class:app.model.Board, target:app.vm.boards},
		"tweets":{class:app.model.Tweet, target:app.vm.tweets}}, (data)->
			console.log 'success'

想定json

	{"boards":[{pk:1,fields:{hogehoge},{pk:2,fields:{hogehoge}}}],"tweets":…..}
	

#### utils.router

	hashchanged = ->
		props = utils.router.decompose('#/:state/:pk')
		props.state ?= 'top'
		if props.state is 'company'
			console.log "ここで書き分ける"

### 課題
 - １対多関係（逆関係含む）用のutil
 現状では自分でマッピングするしかない
 - observableArrayのsortのタイミングの制御
 - 出来ればknockout, django依存の部分を削除していきたい  
 とくに名前空間（現状はdjangoのinclude依存）．requirejs?
 - エラーハンドリング  
 jsdeffered利用かなぁ．
 - knockoutが弱いアニメーション部分の補足
 - ディレクトリ構成  
 ディレクトリ構成も決めちゃう
 - モデルクラスの自動生成  
 django側のリフレクションを利用する．
 (djangoのjsonシリアライズにモデルクラス名を追加すりゃ出来そう．)