(function () {
  'use strict';

  var APP_ID = 'ra-motion-autofill';
  var STORAGE_KEY = 'ra-motion-autofill-v1';
  var MAX_GROUPS = 3; // 通常1 + 差分最大2

  if (document.getElementById(APP_ID)) return;

  var style = document.createElement('style');
  style.textContent = [
    '#' + APP_ID + '{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans JP",sans-serif;max-width:1100px;margin:16px auto;padding:16px;border:1px solid #d8dee6;border-radius:10px;background:#fff;color:#222;box-sizing:border-box}',
    '#' + APP_ID + ' *{box-sizing:border-box}',
    '#' + APP_ID + ' h2{margin:0 0 8px;font-size:22px}',
    '#' + APP_ID + ' .ra-note{margin:0 0 14px;color:#555;font-size:13px;line-height:1.65}',
    '#' + APP_ID + ' details{border:1px solid #d8dee6;border-radius:8px;margin:10px 0;background:#fafbfc}',
    '#' + APP_ID + ' summary{cursor:pointer;font-weight:700;padding:10px 12px;background:#f1f3f5;border-radius:8px}',
    '#' + APP_ID + ' details[open] summary{border-bottom:1px solid #d8dee6;border-radius:8px 8px 0 0}',
    '#' + APP_ID + ' .ra-body{padding:12px}',
    '#' + APP_ID + ' .ra-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
    '#' + APP_ID + ' .ra-field{display:flex;flex-direction:column;gap:4px}',
    '#' + APP_ID + ' label{font-size:13px;font-weight:600}',
    '#' + APP_ID + ' input[type=text],#' + APP_ID + ' textarea{width:100%;border:1px solid #cbd3dc;border-radius:6px;padding:8px;background:#fff;color:#222;font:inherit}',
    '#' + APP_ID + ' textarea{min-height:72px;resize:vertical;line-height:1.5}',
    '#' + APP_ID + ' .ra-motion-row{display:grid;grid-template-columns:90px 1fr 120px;gap:8px;align-items:start;margin:8px 0}',
    '#' + APP_ID + ' .ra-motion-name{font-weight:700;padding-top:9px}',
    '#' + APP_ID + ' .ra-hit textarea{text-align:center;min-height:72px}',
    '#' + APP_ID + ' .ra-actions{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}',
    '#' + APP_ID + ' button{border:1px solid #9aa7b4;background:#f5f7f9;color:#222;border-radius:6px;padding:8px 14px;cursor:pointer;font-weight:600}',
    '#' + APP_ID + ' button:hover{background:#e9edf1}',
    '#' + APP_ID + ' button.ra-primary{background:#2f6fdd;color:#fff;border-color:#2f6fdd}',
    '#' + APP_ID + ' button.ra-primary:hover{background:#285fbf}',
    '#' + APP_ID + ' .ra-check{display:flex;align-items:center;gap:8px;font-size:13px}',
    '#' + APP_ID + ' .ra-output{min-height:320px;font-family:Consolas,"Noto Sans Mono CJK JP",monospace;white-space:pre;tab-size:2}',
    '#' + APP_ID + ' .ra-status{min-height:20px;font-size:13px;color:#2c6b2f}',
    '@media(max-width:760px){#' + APP_ID + ' .ra-grid{grid-template-columns:1fr}#' + APP_ID + ' .ra-motion-row{grid-template-columns:72px 1fr 92px}#' + APP_ID + '{padding:10px}}'
  ].join('');
  document.head.appendChild(style);

  var root = document.createElement('div');
  root.id = APP_ID;
  root.innerHTML = [
    '<h2>FGO モーション・オートフィル</h2>',
    '<p class="ra-note">通常モーション1種と差分モーション最大2種を生成します。差分では未入力のBattle Character・スキル・Battle Motion行を自動で省略します。モーション欄とHit欄は「1行＝1工程」で対応し、Hit欄の数字には出力時に自動で「Hit」を付けます。</p>',
    '<details open>',
      '<summary>出力設定</summary>',
      '<div class="ra-body ra-grid">',
        '<div class="ra-field"><label for="ra-title-1">通常ブロック名</label><input id="ra-title-1" type="text" value="モーション一覧"></div>',
        '<div></div>',
        '<div class="ra-field"><label for="ra-title-2">差分1 ブロック名</label><input id="ra-title-2" type="text" value="第3再臨以降"></div>',
        '<div class="ra-field"><label class="ra-check"><input id="ra-enable-2" type="checkbox" checked> 差分1を出力する</label></div>',
        '<div class="ra-field"><label for="ra-title-3">差分2 ブロック名</label><input id="ra-title-3" type="text" value="差分モーション2"></div>',
        '<div class="ra-field"><label class="ra-check"><input id="ra-enable-3" type="checkbox"> 差分2を出力する</label></div>',
      '</div>',
    '</details>',
    '<div id="ra-groups"></div>',
    '<div class="ra-actions">',
      '<button id="ra-generate" class="ra-primary" type="button">@wiki記法を生成</button>',
      '<button id="ra-copy" type="button">生成結果をコピー</button>',
      '<button id="ra-save" type="button">入力内容を保存</button>',
      '<button id="ra-clear" type="button">すべてクリア</button>',
    '</div>',
    '<div id="ra-status" class="ra-status" aria-live="polite"></div>',
    '<div class="ra-field"><label for="ra-output">生成結果</label><textarea id="ra-output" class="ra-output" spellcheck="false" placeholder="ここに@wiki記法が生成されます"></textarea></div>'
  ].join('');

  var current = document.currentScript;
  if (current && current.parentNode) current.parentNode.insertBefore(root, current.nextSibling);
  else document.body.appendChild(root);

  var groupsHost = root.querySelector('#ra-groups');
  var statusEl = root.querySelector('#ra-status');
  var outputEl = root.querySelector('#ra-output');
  var cardKinds = ['Buster', 'Arts', 'Quick'];

  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }

  function groupHtml(index, label) {
    var rows = '';
    cardKinds.forEach(function (kind) {
      for (var i = 1; i <= 3; i++) rows += motionInputHtml(kind.toLowerCase() + i, kind + ' ' + i);
    });
    rows += motionInputHtml('ex', 'EX');
    rows += motionInputHtml('np', '宝具');

    return [
      '<details class="ra-group" data-group="' + index + '" ' + (index === 1 ? 'open' : '') + '>',
        '<summary>' + escHtml(label) + '</summary>',
        '<div class="ra-body">',
          '<div class="ra-grid">',
            '<div class="ra-field"><label>Battle Character 第1段階</label><textarea data-key="battle1"></textarea></div>',
            '<div class="ra-field"><label>Battle Character 第2段階</label><textarea data-key="battle2"></textarea></div>',
            '<div class="ra-field"><label>Battle Character 第3段階</label><textarea data-key="battle3"></textarea></div>',
            '<div class="ra-field"><label>スキル使用 1</label><textarea data-key="skill1"></textarea></div>',
            '<div class="ra-field"><label>スキル使用 2</label><textarea data-key="skill2"></textarea></div>',
            '<div class="ra-field"><label>スキル使用 3</label><textarea data-key="skill3"></textarea></div>',
          '</div>',
          '<h3 style="margin:16px 0 6px;font-size:16px">Battle Motion</h3>',
          '<div class="ra-note">モーションとHitは行番号で対応します。Hitがない工程はHit欄を空行にしてください。例：Hit欄に「2」「1+1」と入力すると「2Hit」「1+1Hit」と出力します。</div>',
          rows,
        '</div>',
      '</details>'
    ].join('');
  }

  function motionInputHtml(key, label) {
    return [
      '<div class="ra-motion-row">',
        '<div class="ra-motion-name">' + escHtml(label) + '</div>',
        '<textarea data-key="' + key + '" aria-label="' + escHtml(label) + ' モーション" placeholder="1行＝1工程"></textarea>',
        '<div class="ra-hit"><textarea data-key="' + key + 'Hit" aria-label="' + escHtml(label) + ' Hit数" placeholder="2\n1+1"></textarea></div>',
      '</div>'
    ].join('');
  }

  groupsHost.innerHTML = [
    groupHtml(1, '通常モーション'),
    groupHtml(2, '差分モーション1'),
    groupHtml(3, '差分モーション2')
  ].join('');

  function allFieldElements() {
    return Array.prototype.slice.call(root.querySelectorAll('input, textarea'));
  }

  function setStatus(text, isError) {
    statusEl.textContent = text || '';
    statusEl.style.color = isError ? '#b42318' : '#2c6b2f';
  }

  function normalizeNewlines(value) {
    return String(value == null ? '' : value).replace(/\r\n?/g, '\n');
  }

  function wikiSafe(value) {
    return normalizeNewlines(value).replace(/\|/g, '&#124;').trim();
  }

  function isFilled(value) {
    return normalizeNewlines(value).trim() !== '';
  }

  function textLines(value) {
    return normalizeNewlines(value).split('\n').map(function (s) {
      return s.trim().replace(/\|/g, '&#124;');
    }).filter(Boolean);
  }

  function motionLines(value) {
    return textLines(value);
  }

  function plainCell(value, blankTemplate) {
    var lines = textLines(value);
    if (!lines.length) return blankTemplate ? '&br()&br()' : '';
    return lines.join('&br()');
  }

  function motionCell(value, blankTemplate) {
    var lines = motionLines(value);
    if (!lines.length) return blankTemplate ? ' →&br() →&br()' : '';
    return lines.join(' →&br()');
  }

  function formatHitToken(value) {
    var token = String(value == null ? '' : value).trim().replace(/\|/g, '&#124;');
    if (!token) return '';
    if (/Hit$/i.test(token)) return token.replace(/Hit$/i, 'Hit');
    return token + 'Hit';
  }

  function hitCell(hitValue, motionValue, blankTemplate) {
    var raw = normalizeNewlines(hitValue);
    var hitLines = raw === '' ? [] : raw.split('\n').map(formatHitToken);
    var motionCount = motionLines(motionValue).length;
    var count = Math.max(motionCount, hitLines.length);
    var hasHit = hitLines.some(function (line) { return line !== ''; });

    if (!hasHit) {
      if (blankTemplate && motionCount === 0) return '&br()&br()Hit';
      if (motionCount > 1) return new Array(motionCount).join('&br()');
      return '';
    }

    var output = [];
    for (var i = 0; i < count; i++) output.push(hitLines[i] || '');
    return output.join('&br()');
  }

  function getGroupData(index) {
    var group = root.querySelector('.ra-group[data-group="' + index + '"]');
    var data = {};
    Array.prototype.forEach.call(group.querySelectorAll('[data-key]'), function (el) {
      data[el.getAttribute('data-key')] = el.value;
    });
    return data;
  }

  function motionRowHasData(data, key) {
    return isFilled(data[key]) || isFilled(data[key + 'Hit']);
  }

  function groupHasAnyData(data) {
    var keys = ['battle1','battle2','battle3','skill1','skill2','skill3','ex','exHit','np','npHit'];
    cardKinds.forEach(function (kind) {
      var k = kind.toLowerCase();
      for (var i = 1; i <= 3; i++) {
        keys.push(k + i);
        keys.push(k + i + 'Hit');
      }
    });
    return keys.some(function (key) { return isFilled(data[key]); });
  }

  function pushBattleAndSkill(lines, data, isDiff) {
    var battleKeys = ['battle1', 'battle2', 'battle3'];
    var anyBattle = battleKeys.some(function (key) { return isFilled(data[key]); });

    if (!isDiff || anyBattle) {
      lines.push('|>|>|>|BGCOLOR(#E6E6FA):CENTER:Battle Character|');
      battleKeys.forEach(function (key, idx) {
        if (isDiff && !isFilled(data[key])) return;
        lines.push('|>|第' + (idx + 1) + '段階|>|LEFT:' + plainCell(data[key], !isDiff) + '|');
      });
    }

    var skillKeys = ['skill1', 'skill2', 'skill3'];
    var emittedSkill = 0;
    skillKeys.forEach(function (key, idx) {
      if (isDiff && !isFilled(data[key])) return;
      var firstCol = emittedSkill === 0 ? 'スキル使用' : '~';
      lines.push('|' + firstCol + '|' + (idx + 1) + '|>|LEFT:' + plainCell(data[key], !isDiff) + '|');
      emittedSkill++;
    });
  }

  function pushCardRows(lines, data, kind, isDiff) {
    var k = kind.toLowerCase();
    var emitted = 0;
    for (var i = 1; i <= 3; i++) {
      var key = k + i;
      if (isDiff && !motionRowHasData(data, key)) continue;
      var firstCol = emitted === 0 ? kind : '~';
      lines.push('|' + firstCol + '|' + i + '|' + motionCell(data[key], !isDiff) + '|' + hitCell(data[key + 'Hit'], data[key], !isDiff) + '|');
      emitted++;
    }
  }

  function pushExNpRows(lines, data, isDiff) {
    if (!isDiff || motionRowHasData(data, 'ex')) {
      lines.push('|>|EX|' + motionCell(data.ex, !isDiff) + '|' + hitCell(data.exHit, data.ex, !isDiff) + '|');
      lines.push('//|EX|1| →&br() →&br()|&br()&br()Hit|');
      lines.push('//|~|2| →&br() →&br()|&br()&br()Hit|');
    }
    if (!isDiff || motionRowHasData(data, 'np')) {
      lines.push('|>|宝具|' + motionCell(data.np, !isDiff) + '|' + hitCell(data.npHit, data.np, !isDiff) + '|');
      lines.push('//|宝具|1| →&br() →&br()|&br()&br()Hit|');
      lines.push('//|~|2| →&br() →&br()|&br()&br()Hit|');
      lines.push('//|~|3| →&br() →&br()|&br()&br()Hit|');
    }
  }

  function buildWikiBlock(title, data, isDiff) {
    var lines = [];
    lines.push('#region(close,' + wikiSafe(title || (isDiff ? '差分モーション' : 'モーション一覧')) + ')');
    lines.push('|BGCOLOR(#F5FFFA):CENTER:110|BGCOLOR(#F5FFFA):CENTER:40|BGCOLOR(#F5FFFA):LEFT:1000|BGCOLOR(#F5FFFA):CENTER:65|c');

    pushBattleAndSkill(lines, data, isDiff);

    var anyMotion = cardKinds.some(function (kind) {
      var k = kind.toLowerCase();
      return [1,2,3].some(function (i) { return motionRowHasData(data, k + i); });
    }) || motionRowHasData(data, 'ex') || motionRowHasData(data, 'np');

    if (!isDiff || anyMotion) {
      lines.push('|>|>|BGCOLOR(#E6E6FA):CENTER:Battle Motion|BGCOLOR(#E6E6FA):CENTER:Hit|');
      cardKinds.forEach(function (kind) { pushCardRows(lines, data, kind, isDiff); });
      pushExNpRows(lines, data, isDiff);
    }

    lines.push('');
    lines.push('');
    lines.push('#endregion()');
    return lines.join('\n');
  }

  function generate() {
    var blocks = [buildWikiBlock(root.querySelector('#ra-title-1').value, getGroupData(1), false)];
    for (var i = 2; i <= MAX_GROUPS; i++) {
      if (!root.querySelector('#ra-enable-' + i).checked) continue;
      var data = getGroupData(i);
      if (!groupHasAnyData(data)) continue;
      blocks.push(buildWikiBlock(root.querySelector('#ra-title-' + i).value, data, true));
    }
    outputEl.value = blocks.join('\n\n');
    save(false);
    setStatus('生成しました。差分ブロックでは未入力行を省略しています。');
  }

  function serialize() {
    var data = {};
    allFieldElements().forEach(function (el, i) {
      var key = el.id || ('field_' + i);
      if (el.hasAttribute('data-key')) {
        var group = el.closest('.ra-group');
        key = 'g' + group.getAttribute('data-group') + '_' + el.getAttribute('data-key');
      }
      data[key] = el.type === 'checkbox' ? el.checked : el.value;
    });
    return data;
  }

  function restore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      allFieldElements().forEach(function (el, i) {
        var key = el.id || ('field_' + i);
        if (el.hasAttribute('data-key')) {
          var group = el.closest('.ra-group');
          key = 'g' + group.getAttribute('data-group') + '_' + el.getAttribute('data-key');
        }
        if (!Object.prototype.hasOwnProperty.call(data, key)) return;
        if (el.type === 'checkbox') el.checked = !!data[key];
        else el.value = data[key];
      });
      setStatus('前回保存した入力内容を復元しました。');
    } catch (e) {
      setStatus('保存データの復元に失敗しました。', true);
    }
  }

  function save(showMessage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize()));
      if (showMessage !== false) setStatus('入力内容をこのブラウザに保存しました。');
    } catch (e) {
      if (showMessage !== false) setStatus('入力内容を保存できませんでした。', true);
    }
  }

  function clearAll() {
    if (!window.confirm('入力内容と保存データをすべて消去します。よろしいですか？')) return;
    localStorage.removeItem(STORAGE_KEY);
    allFieldElements().forEach(function (el) {
      if (el.id === 'ra-title-1') el.value = 'モーション一覧';
      else if (el.id === 'ra-title-2') el.value = '第3再臨以降';
      else if (el.id === 'ra-title-3') el.value = '差分モーション2';
      else if (el.id === 'ra-enable-2') el.checked = true;
      else if (el.id === 'ra-enable-3') el.checked = false;
      else if (el.id === 'ra-output') el.value = '';
      else if (el.hasAttribute('data-key')) el.value = '';
    });
    outputEl.value = '';
    applyGroupVisibility();
    setStatus('クリアしました。');
  }

  function copyOutput() {
    if (!outputEl.value.trim()) generate();
    var text = outputEl.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setStatus('生成結果をクリップボードへコピーしました。');
      }).catch(fallbackCopy);
    } else fallbackCopy();
  }

  function fallbackCopy() {
    outputEl.focus();
    outputEl.select();
    try {
      document.execCommand('copy');
      setStatus('生成結果をクリップボードへコピーしました。');
    } catch (e) {
      setStatus('自動コピーに失敗しました。生成結果を選択して手動でコピーしてください。', true);
    }
  }

  function applyGroupVisibility() {
    for (var i = 2; i <= MAX_GROUPS; i++) {
      var checkbox = root.querySelector('#ra-enable-' + i);
      var group = root.querySelector('.ra-group[data-group="' + i + '"]');
      group.style.display = checkbox.checked ? '' : 'none';
    }
  }

  root.querySelector('#ra-generate').addEventListener('click', generate);
  root.querySelector('#ra-copy').addEventListener('click', copyOutput);
  root.querySelector('#ra-save').addEventListener('click', function () { save(true); });
  root.querySelector('#ra-clear').addEventListener('click', clearAll);
  for (var i = 2; i <= MAX_GROUPS; i++) root.querySelector('#ra-enable-' + i).addEventListener('change', applyGroupVisibility);

  restore();
  applyGroupVisibility();
}());
