/* dc-lite: a tiny template renderer for the AI for HE static site.
   Supports {{holes}} in text and attributes, <sc-for list as>, <sc-if value>,
   on*="{{fn}}" event bindings, and a DCLogic base class with setState. */
(function () {
  'use strict';
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;

  function lookup(path, scope) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.');
    var v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }
  function str(v) { return v == null || v === false && false ? '' : String(v); }
  function fill(text, scope) {
    return text.replace(HOLE, function (_, p) { var v = lookup(p, scope); return v == null ? '' : String(v); });
  }
  function soleHole(text) {
    var m = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/.exec(text);
    return m ? m[1] : null;
  }
  var EVENTS = { onclick: 'click', onchange: 'input', oninput: 'input', onsubmit: 'submit', onkeydown: 'keydown' };

  function renderNodes(nodes, scope, out) {
    for (var i = 0; i < nodes.length; i++) renderNode(nodes[i], scope, out);
  }
  function renderNode(node, scope, out) {
    if (node.nodeType === 3) {
      out.appendChild(document.createTextNode(fill(node.nodeValue, scope)));
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();
    if (tag === 'sc-for') {
      var list = lookup(soleHole(node.getAttribute('list')) || '', scope) || [];
      var as = node.getAttribute('as') || 'item';
      for (var k = 0; k < list.length; k++) {
        var child = Object.create(scope);
        child[as] = list[k];
        renderNodes(node.childNodes, child, out);
      }
      return;
    }
    if (tag === 'sc-if') {
      var cond = lookup(soleHole(node.getAttribute('value')) || '', scope);
      if (cond) renderNodes(node.childNodes, scope, out);
      return;
    }
    var el = node.namespaceURI === 'http://www.w3.org/2000/svg'
      ? document.createElementNS(node.namespaceURI, node.tagName)
      : document.createElement(node.tagName);
    for (var a = 0; a < node.attributes.length; a++) {
      var at = node.attributes[a];
      var name = at.name;
      if (name.indexOf('hint-placeholder') === 0) continue;
      var lname = name.toLowerCase();
      if (EVENTS[lname]) {
        var fn = lookup(soleHole(at.value) || '', scope);
        if (typeof fn === 'function') el.addEventListener(EVENTS[lname], fn);
        continue;
      }
      var val = at.value.indexOf('{{') === -1 ? at.value : fill(at.value, scope);
      el.setAttribute(name, val);
      if (lname === 'value' && 'value' in el) el.value = val;
    }
    if (tag === 'template') { el.innerHTML = node.innerHTML; out.appendChild(el); return; }
    renderNodes(node.childNodes, scope, el);
    out.appendChild(el);
  }

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) {
    var s = this.state || {};
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) s[k] = patch[k];
    this.state = s;
    if (this.__render) this.__render();
  };
  window.DCLogic = DCLogic;

  window.dcMount = function (Component, props) {
    var tpl = document.getElementById('dc-template');
    var app = document.getElementById('dc-app');
    var comp = new Component(props);
    comp.props = props;
    if (!comp.state) comp.state = {};
    function render() {
      // remember focus, caret and open <details> so re-renders feel seamless
      var active = document.activeElement, focusId = active && active.id, caret = null;
      try { if (focusId && 'selectionStart' in active) caret = [active.selectionStart, active.selectionEnd]; } catch (e) {}
      var open = {};
      Array.prototype.forEach.call(app.querySelectorAll('details[open] > summary'), function (s) { open[s.textContent.trim()] = true; });
      var vals = comp.renderVals();
      var frag = document.createDocumentFragment();
      renderNodes(tpl.content.childNodes, vals, frag);
      app.replaceChildren(frag);
      Array.prototype.forEach.call(app.querySelectorAll('details > summary'), function (s) {
        if (open[s.textContent.trim()]) s.parentNode.setAttribute('open', '');
      });
      if (vals && vals.bg) { document.documentElement.style.background = vals.bg; document.body.style.background = vals.bg; }
      if (focusId) {
        var el = document.getElementById(focusId);
        if (el) { el.focus(); try { if (caret) el.setSelectionRange(caret[0], caret[1]); } catch (e) {} }
      }
    }
    comp.__render = render;
    render();
    // honour a #fragment once the content exists
    if (location.hash && !window.__dcScrolled) {
      window.__dcScrolled = true;
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t) t.scrollIntoView();
    }
    return comp;
  };
})();
