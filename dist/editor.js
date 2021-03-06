!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.editor=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

var dropdown = _dereq_('./dropdown');

function close(el) {
  var d = d3.select(document.body).selectAll('#actionDropdown').data([]);
  d.exit().remove();
}

function open(el, items) {
  var d = d3.select(document.body).selectAll('#actionDropdown').data([0]);
  // enter
  d.enter().append('div').attr('id', 'actionDropdown').style('position', 'absolute');

  // update
  var bbox = el.getBoundingClientRect();
  d.style({
    top: (bbox.top + 15) + "px",
    left: bbox.left + "px",
  });

  var drop = dropdown().items(items);
  d.call(drop);
  return drop;

}
function dialog(context) {
  var code = '';
  var evt = d3.dispatch('code', 'template');

  function _dialog (el) {

    var codeEditor = el.selectAll('textarea#code')
      .data([code]);

    var enter = codeEditor.enter();
    var divHeader = enter.append('div')
      .attr('class','header');

    divHeader.append('a')
      .attr('class','expandButton')
      .on('click', function(){
        // console.log(event.target);
        _expand();
      })

    divHeader.append('h1')
      .text('Odyssey editor');
      
    divHeader.append('select')
      .html(['torque', 'scroll', 'slides', 'rolling_stones'].map(function(v) {
        return "<option value='" + v + "'>" + v + "</option>";
      }).join('\n'))
      .on('change', function() {
        evt.template(this.value);
      });

    var textarea = enter.append('textarea')
      .attr('id', 'code')
      .on('keyup.editor', function() {
        evt.code(this.value);
      });

    textarea.each(function() {
      var codemirror = this.codemirror = CodeMirror.fromTextArea(this, {
        mode: "markdown"
      });
      this.codemirror.on('change', function(c) {
        evt.code(c.getValue());
        placeActionButtons(el, codemirror);
      });
    });

    function _expand(){
      var _t = d3.select('#editor_modal');
      var _hassClass = _t.classed('expanded')
      _t.classed('expanded', !_hassClass);

      var _b = d3.select('a.expandButton');
      _b.classed('expanded', !_hassClass);

    }

    // update
    codeEditor.each(function(d) {
      this.codemirror.setValue(d);
      placeActionButtons(el, this.codemirror);
    });

  }

  var SLIDE_REGEXP = /^#[^#]+/i;
  var ACTIONS_BLOCK_REGEXP = /\s*```/i;

  // adds action to slideNumber.
  // creates it if the slide does not have any action
  function addAction(codemirror, slideNumer, action) {
    // search for a actions block
    var currentLine;
    var c = 0;
    for (var i = slideNumer + 1; i < codemirror.lineCount(); ++i) {
      var line = codemirror.getLineHandle(i).text;
      if (ACTIONS_BLOCK_REGEXP.exec(line)) {
        if (++c === 2) {
          // inser in the previous line
          currentLine = codemirror.getLineHandle(i);
          codemirror.setLine(i, action + "\n" + currentLine.text);
          return;
        }
      } else if(SLIDE_REGEXP.exec(line)) {
        // not found, inser a block
        currentLine = codemirror.getLineHandle(slideNumer);
        codemirror.setLine(slideNumer, currentLine.text + "\n```\n" + action +"\n```\n");
        return;
      }
    }
    // insert at the end
    currentLine = codemirror.getLineHandle(slideNumer);
    codemirror.setLine(slideNumer, currentLine.text + "\n```\n"+ action + "\n```\n");
  }


  // place actions buttons on the left of the beggining of each slide
  function placeActionButtons(el, codemirror) {

    // search for h1's
    var positions = [];
    var lineNumber = 0;
    codemirror.eachLine(function(a) { 
      if (SLIDE_REGEXP.exec(a.text)) {
         positions.push({
           pos: codemirror.heightAtLine(lineNumber),
           line: lineNumber
         });
      }
      ++lineNumber;
    });

    //remove previously added buttons
    el.selectAll('.actionButton').remove()

    var buttons = el.selectAll('.actionButton')
      .data(positions);

    // enter
    buttons.enter()
      .append('div')
      .attr('class', 'actionButton')
      .style({ position: 'absolute' })
      .html('add')
      .on('click', function(d) {
        var self = this;
        open(this, context.actions()).on('click', function(e) {
          context.getAction(e, function(action) {
            addAction(codemirror, d.line, action);
          });
          close(self);
        });
      });

    // update
    var LINE_HEIGHT = 28;
    buttons.style({
      top: function(d) { return (d.pos - LINE_HEIGHT) + "px"; },
      left: 16 + "px"
    });

  }

  _dialog.code = function(_) {
    if (!arguments.length) return _;
    code = _;
    return _dialog;
  };

  return d3.rebind(_dialog, evt, 'on');
}

module.exports = dialog;

},{"./dropdown":2}],2:[function(_dereq_,module,exports){

function dropdown() {
  var evt = d3.dispatch('click');
  var items = [];

  function _dropdown(el) {
    var i = el.selectAll('.item').data(items);
    // enter
    i.enter().append('li').attr('class', 'item').on('click', function(d) {
      evt.click(d.value || d);
    });
    // update
    i.text(function(d) { return d.text || d; });
    // remove
    i.exit().remove();

    return _dropdown;
  }

  // gets a list of { value: '...', text: '...' }
  _dropdown.items = function(_) {
    if (!arguments.length) return _;
    items = _;
    return _dropdown;
  };

  return d3.rebind(_dropdown, evt, 'on');
}


module.exports = dropdown;

},{}],3:[function(_dereq_,module,exports){

//i18n placeholder
function _t(s) { return s; }


var dialog = _dereq_('./dialog');

function editor() {

  var body = d3.select(document.body);
  var context = {};

  var template = body.select('#template');
  var code_dialog = dialog(context);

  var iframeWindow;
  var $editor = body.append('div')
    .attr('id', 'editor_modal')
    .call(code_dialog);


  d3.select(document.body);

  var callbacks = {};
  window.addEventListener("message", function(event) {
    var msg = JSON.parse(event.data);
    if (msg.id) {
      callbacks[msg.id](msg.data);
      delete callbacks[msg.id];
    }
  });


  function sendMsg(_, done) {
    var id = new Date().getTime();
    callbacks[id] = done;
    _.id = id;
    iframeWindow.postMessage(JSON.stringify(_), iframeWindow.location);
  }

  function execCode(_, done) {
    var id = new Date().getTime();
    callbacks[id] = done;
    iframeWindow.postMessage(JSON.stringify({
      type: 'code',
      code: _,
      id: id
    }), iframeWindow.location);
  }

  function sendCode(_) {
    iframeWindow.postMessage(JSON.stringify({
      type: 'md',
      code: _
    }), iframeWindow.location);
  }

  function getAction(_, done) {
    sendMsg({ type: 'get_action', code: _ }, done);
  }


  code_dialog.on('code.editor', function(code) {
    sendCode(code);
    O.Template.Storage.save(code);
  });

  context.sendCode = sendCode;
  context.execCode = execCode;
  context.actions = function(_) {
    if (!arguments.length) return this._actions;
    this._actions = _;
    return this;
  };
  context.getAction = getAction;


  template.on('load', function() {
    iframeWindow = template.node().contentWindow;
    O.Template.Storage.load(function(md) {
      sendCode(md);
      $editor.call(code_dialog.code(md));
    });
    sendMsg({ type: 'actions' }, function(data) {
      context.actions(data);
    });
  });

  function set_template(t) {
    template.attr('src', t + ".html");
  }

  code_dialog.on('template.editor', function(t) {
    set_template(t);
  });

  set_template('scroll');

}

module.exports = editor;

},{"./dialog":1}]},{},[3])
(3)
});