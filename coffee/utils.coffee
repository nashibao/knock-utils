this.utils ?= {}
utils = this.utils
###
knockout, django依存型のutil

TODO: modelにdicsとmap関数を暗黙的に実装する必要がある
 dicsにかんしては継承で、mapにかんしてはinterface定義に置き換えたい
 （must be overridedな関数にして継承にするかprototypeを使うか．)
TODO: エラーハンドリング

###

utils.debug = true

utils.log = (obj) ->
	if utils.debug
		console.info obj

# 型を返す
# @see http://minghai.github.com/library/coffeescript/07_the_bad_parts.html
utils.type = do ->
	classToType = {}
	for name in "Boolean Number String Function Array Date RegExp Undefined Null".split(" ")
		classToType["[object " + name + "]"] = name.toLowerCase()
	(obj) ->
		strType = Object::toString.call(obj)
		classToType[strType] or "object"

class utils.model
	###
	model関係のutil
	###

	# 無ければfalse
	@get: (pk, kls) ->
		if pk of kls.dics()
			return kls.dics()[pk]
		else
			return false

	# 無ければ作成
	@get_or_create: (pk, kls) ->
		if pk of kls.dics()
			return kls.dics()[pk]
		else
			obj = new kls()
			obj.pk(pk)
			kls.dics()[pk] = obj
			return obj

	# djangoクラスオブジェクトのマッピング用
	@map: (data, kls, param) ->
		pk = data.pk
		fields = data.fields
		obj = @get_or_create(pk, kls)
		obj.map(fields, param)
		return obj

class utils.model.Model
	@dics = ->
		@_dics ?= {}
		return @_dics
	constructor: () ->
		@pk = ko.observable(-1)
	map: (fields, param) ->
		utils.log 'must be overrided'

class utils.api
	###
	network関係のutil
	get, post
	###

	@getJSON = (url, data, callback) ->
		utils.log url
		$.ajaxSetup {cache: false}
		$.getJSON url, data, (data) ->
			$.ajaxSetup {cache: true}
			callback data

	@postJSON = (url, data, callback) ->
		utils.log url
		$.ajaxSetup {cache: false}
		$.ajax {
			url: url,
			type: "POST",
			data: data,
			dataType: "json",
			complete: (data, dataType) ->
				$.ajaxSetup {cache: true}
				callback data
			}

	# X: ここは本当はdictionaryでparamを渡すようにする.
	@get = (url, params, callback) ->
		@getJSON url, (data) ->
			utils.log data
			for key, val of params
				{class:kls, target:target} = val
				for jsn in data[key]
					obj = utils.model.map(jsn, kls, 'get')
					target.push(obj) if target
			callback(data)

	@post = (url, param, callback) ->
		@postJSON url, 'test', (d) ->
			data = $.evalJSON d.responseText
			utils.log data
			for key, kls of param
				jsn = data[key][0]
				if kls
					obj = utils.model.map(jsn, kls, 'post')
			callback(data)

class utils.router
	@decompose = (template) ->
		obj = {}
		hash = location.hash
		utils.log "hashchanged #{hash} to #{template}"
		props = template.split('/')
		hashs = hash.split('/')
		for i in [0..props.length-1]
			prop = props[i]
			if prop.indexOf(":")==0
				p = prop.replace(":","")
				if hashs.length > i
					h = hashs[i]
					obj[p]=h
				else
					obj[p]=undefined
		return obj

class utils.date
	# safariとieが受け付けるdate用文字列に変換する
	@reverse_for_safari = (datestr, hoursplitter, datesplitter) ->
		daystr = datestr
		hourstr = false
		if hoursplitter
			date_hour = datestr.split(hoursplitter)
			if date_hour.length!=2
				return datestr
			daystr = date_hour[0]
			hourstr = date_hour[1]
		day_month_year = daystr.split(datesplitter)
		if day_month_year.length!=3
			return datestr
		daystr = "#{day_month_year[2]}/#{day_month_year[1]}/#{day_month_year[0]}"
		if hourstr
			return "#{daystr} #{hourstr}"
		return daystr
	# Dateオブジェクト/文字列を任意の文字列に変換する
	@formatedDate = do ->
		zFill = (number) ->
			numStr = String number
			if numStr.length < 2
				numStr = '0' + numStr
			numStr
		(date, format) ->
			if utils.type(date) is 'string'
				dateStrList = date.split /:|-|\s/
				date = new Date dateStrList[0],
					parseInt(dateStrList[1]) - 1, dateStrList[2],
					dateStrList[3], dateStrList[4], dateStrList[5]
			format.replace(/%Y/, date.getFullYear())
				.replace(/%m/, zFill(date.getMonth() + 1))
				.replace(/%d/, zFill(date.getDate()))
				.replace(/%H/, zFill(date.getHours()))
				.replace(/%M/, zFill(date.getMinutes()))
				.replace(/%S/, zFill(date.getSeconds()))
	@convertToJapaneseLikeTwitter = (date) ->
		today = new Date()
		interval = today - date
		minutes = Math.round(interval/(1000*60))
		hour = Math.round(interval/(60*60*1000))
		if minutes < 10
			return "いま"
		if minutes < 60
			return "#{minutes}分前"
		if hour < 46
			return "#{hour}時間前"
		return "#{date.getMonth()}/#{date.getDay()}"


