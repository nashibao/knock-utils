(function() {
  var utils;

  if (this.utils == null) this.utils = {};

  utils = this.utils;

  /*
  knockout, django依存型のutil
  
  TODO: modelにdicsとmap関数を暗黙的に実装する必要がある
   dicsにかんしては継承で、mapにかんしてはinterface定義に置き換えたい
   （must be overridedな関数にして継承にするかprototypeを使うか．)
  TODO: エラーハンドリング
  */

  utils.debug = true;

  utils.log = function(obj) {
    if (utils.debug) return console.info(obj);
  };

  utils.model = (function() {

    function model() {}

    /*
    	model関係のutil
    */

    model.get = function(pk, kls) {
      if (pk in kls.dics()) {
        return kls.dics()[pk];
      } else {
        return false;
      }
    };

    model.get_or_create = function(pk, kls) {
      var obj;
      if (pk in kls.dics()) {
        return kls.dics()[pk];
      } else {
        obj = new kls();
        obj.pk(pk);
        kls.dics()[pk] = obj;
        return obj;
      }
    };

    model.map = function(data, kls, param) {
      var fields, obj, pk;
      pk = data.pk;
      fields = data.fields;
      obj = this.get_or_create(pk, kls);
      obj.map(fields, param);
      return obj;
    };

    return model;

  })();

  utils.model.Model = (function() {

    Model.dics = function() {
      if (this._dics == null) this._dics = {};
      return this._dics;
    };

    function Model() {
      this.pk = ko.observable(-1);
    }

    Model.prototype.map = function(fields, param) {
      return utils.log('must be overrided');
    };

    return Model;

  })();

  utils.api = (function() {

    function api() {}

    /*
    	network関係のutil
    	get, post
    */

    api.getJSON = function(url, data, callback) {
      utils.log(url);
      $.ajaxSetup({
        cache: false
      });
      return $.getJSON(url, data, function(data) {
        $.ajaxSetup({
          cache: true
        });
        return callback(data);
      });
    };

    api.postJSON = function(url, data, callback) {
      utils.log(url);
      $.ajaxSetup({
        cache: false
      });
      return $.ajax({
        url: url,
        type: "POST",
        data: data,
        dataType: "json",
        complete: function(data, dataType) {
          $.ajaxSetup({
            cache: true
          });
          return callback(data);
        }
      });
    };

    api.get = function(url, params, callback) {
      return this.getJSON(url, function(data) {
        var jsn, key, kls, obj, target, val, _i, _len, _ref;
        utils.log(data);
        for (key in params) {
          val = params[key];
          kls = val["class"], target = val.target;
          _ref = data[key];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            jsn = _ref[_i];
            obj = utils.model.map(jsn, kls, 'get');
            if (target) target.push(obj);
          }
        }
        return callback(data);
      });
    };

    api.post = function(url, param, callback) {
      return this.postJSON(url, 'test', function(d) {
        var data, jsn, key, kls, obj;
        data = $.evalJSON(d.responseText);
        utils.log(data);
        for (key in param) {
          kls = param[key];
          jsn = data[key][0];
          if (kls) obj = utils.model.map(jsn, kls, 'post');
        }
        return callback(data);
      });
    };

    return api;

  })();

  utils.router = (function() {

    function router() {}

    router.decompose = function(template) {
      var h, hash, hashs, i, obj, p, prop, props, _ref;
      obj = {};
      hash = location.hash;
      utils.log("hashchanged " + hash + " to " + template);
      props = template.split('/');
      hashs = hash.split('/');
      for (i = 0, _ref = props.length - 1; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
        prop = props[i];
        if (prop.indexOf(":") === 0) {
          p = prop.replace(":", "");
          if (hashs.length > i) {
            h = hashs[i];
            obj[p] = h;
          } else {
            obj[p] = void 0;
          }
        }
      }
      return obj;
    };

    return router;

  })();

  utils.date = (function() {

    function date() {}

    date.reverse_for_safari = function(datestr, hoursplitter, datesplitter) {
      var date_hour, day_month_year, daystr, hourstr;
      daystr = datestr;
      hourstr = false;
      if (hoursplitter) {
        date_hour = datestr.split(hoursplitter);
        if (date_hour.length !== 2) return datestr;
        daystr = date_hour[0];
        hourstr = date_hour[1];
      }
      day_month_year = daystr.split(datesplitter);
      if (day_month_year.length !== 3) return datestr;
      daystr = "" + day_month_year[2] + "/" + day_month_year[1] + "/" + day_month_year[0];
      if (hourstr) return "" + daystr + " " + hourstr;
      return daystr;
    };

    date.convertToJapaneseLikeTwitter = function(date) {
      var hour, interval, minutes, today;
      today = new Date();
      interval = today - date;
      minutes = Math.round(interval / (1000 * 60));
      hour = Math.round(interval / (60 * 60 * 1000));
      if (minutes < 10) return "いま";
      if (minutes < 60) return "" + minutes + "分前";
      if (hour < 46) return "" + hour + "時間前";
      return "" + (date.getMonth()) + "/" + (date.getDay());
    };

    return date;

  })();

}).call(this);
