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
    '#' + APP_ID + ' h3{margin:16px 0 6px;font-size:16px}',
    '#' + APP_ID + ' h4{margin:12px 0 6px;font-size:14px}',
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
    '#' + APP_ID + ' .ra-special{border-top:1px dashed #cbd3dc;margin-top:14px;padding-top:8px}',
    '#' + APP_ID + ' .ra-special-head{display:flex;align-items:center;justify-content:space-between;gap:8px}',
    '#' + APP_ID + ' .ra-special-row{position:relative}',
    '#' + APP_ID + ' .ra-special-row .ra-remove{position:absolute;right:0;top:-2px;padding:3px 8px;font-size:12px}',
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
    '<p class="ra-note">通常モーション1種と差分モーション最大2種を生成します。スキル・Buster・Arts・Quickは通常/差分とも未入力行を出力しません。EX・宝具は「追加」で必要数だけ増やせます。モーション欄とHit欄は「1行＝1工程」で対応し、Hit欄の数字には出力時に自動で「Hit」を付けます。</p>',
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

  function motionInputHtml(key, label) {
    return [
      '<div class="ra-motion-row">',
        '<div class="ra-motion-name">' + escHtml(label) + '</div>',
        '<textarea data-key="' + key + '" aria-label="' + escHtml(label) + ' モーション" placeholder="1行＝1工程"></textarea>',
        '<div class="ra-hit"><textarea data-key="' + key + 'Hit" aria-label="' + escHtml(label) + ' Hit数" placeholder="2\n1+1"></textarea></div>',
      '</div>'
    ].join('');
  }

  function specialVariantHtml(kind, index) {
    var label = kind === 'ex' ? 'EX' : '宝具';
    return [
      '<div class="ra-special-row" data-special-row="' + kind + '" data-index="' + index + '">',
        '<button class="ra-remove" type="button" data-remove-special="' + kind + '">削除</button>',
        motionInputHtml(kind + index, label + ' ' + index),
      '</div>'
    ].join('');
  }

  function specialSectionHtml(kind) {
    var label = kind === 'ex' ? 'EX' : '宝具';
    return [
      '<div class="ra-special" data-special="' + kind + '">',
        '<div class="ra-special-head">',
          '<h4>' + label + '</h4>',
          '<button type="button" data-add-special="' + kind + '">' + label + 'を追加</button>',
        '</div>',
        '<div data-special-list="' + kind + '">',
          specialVariantHtml(kind, 1),
        '</div>',
      '</div>'
    ].join('');
  }

  function groupHtml(index, label) {
    var rows = '';
    cardKinds.forEach(function (kind) {
      for (var i = 1; i <= 3; i++) rows += motionInputHtml(kind.toLowerCase() + i, kind + ' ' + i);
    });

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
          '<h3>Battle Motion</h3>',
          '<div class="ra-note">Q/A/Bの未入力行は生成時に削除します。EX・宝具は必要数だけ追加できます。Hitがない工程はHit欄を空行にしてください。</div>',
          rows,
          specialSectionHtml('ex'),
          specialSectionHtml('np'),
        '</div>',
      '</details>'
    ].join('');
  }

  groupsHost.innerHTML = [
    groupHtml(1, '通常モーション'),
    groupHtml(2, '差分モーション1'),
    groupHtml(3, '差分モーション2')
  ].join('');

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

  function motionCell(value) {
    var lines = motionLines(value);
    if (!lines.length) return '';
    return lines.join(' →&br()');
  }

  function formatHitToken(value) {
    var token = String(value == null ? '' : value).trim().replace(/\|/g, '&#124;');
    if (!token) return '';
    if (/Hit$/i.test(token)) return token.replace(/Hit$/i, 'Hit');
    return token + 'Hit';
  }

  function hitCell(hitValue, motionValue) {
    var raw = normalizeNewlines(hitValue);
    var hitLines = raw === '' ? [] : raw.split('\n').map(formatHitToken);
    var motionCount = motionLines(motionValue).length;
    var count = Math.max(motionCount, hitLines.length);
    var hasHit = hitLines.some(function (line) { return line !== ''; });

    if (!hasHit) {
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

  function specialIndices(data, kind) {
    var found = {};
    Object.keys(data).forEach(function (key) {
      var match = key.match(new RegExp('^' + kind + '(\\d+)(?:Hit)?$'));
      if (match) found[Number(match[1])] = true;
    });
    return Object.keys(found).map(Number).sort(function (a, b) { return a - b; });
  }

  function specialEntries(data, kind) {
    return specialIndices(data, kind).filter(function (index) {
      return motionRowHasData(data, kind + index);
    }).map(function (index) {
      return {
        motion: data[kind + index] || '',
        hit: data[kind + index + 'Hit'] || ''
      };
    });
  }

  function groupHasAnyData(data) {
    return Object.keys(data).some(function (key) { return isFilled(data[key]); });
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
      if (!isFilled(data[key])) return;
      var firstCol = emittedSkill === 0 ? 'スキル使用' : '~';
      lines.push('|' + firstCol + '|' + (idx + 1) + '|>|LEFT:' + plainCell(data[key], false) + '|');
      emittedSkill++;
    });
  }

  function pushCardRows(lines, data, kind) {
    var k = kind.toLowerCase();
    var emitted = 0;
    for (var i = 1; i <= 3; i++) {
      var key = k + i;
      if (!motionRowHasData(data, key)) continue;
      var firstCol = emitted === 0 ? kind : '~';
      lines.push('|' + firstCol + '|' + i + '|' + motionCell(data[key]) + '|' + hitCell(data[key + 'Hit'], data[key]) + '|');
      emitted++;
    }
  }

  function pushSpecialRows(lines, data, kind) {
    var label = kind === 'ex' ? 'EX' : '宝具';
    var entries = specialEntries(data, kind);
    if (!entries.length) return;

    if (entries.length === 1) {
      lines.push('|>|' + label + '|' + motionCell(entries[0].motion) + '|' + hitCell(entries[0].hit, entries[0].motion) + '|');
      return;
    }

    entries.forEach(function (entry, idx) {
      var firstCol = idx === 0 ? label : '~';
      lines.push('|' + firstCol + '|' + (idx + 1) + '|' + motionCell(entry.motion) + '|' + hitCell(entry.hit, entry.motion) + '|');
    });
  }

  function hasAnyMotion(data) {
    var cardHas = cardKinds.some(function (kind) {
      var k = kind.toLowerCase();
      return [1,2,3].some(function (i) { return motionRowHasData(data, k + i); });
    });
    return cardHas || specialEntries(data, 'ex').length > 0 || specialEntries(data, 'np').length > 0;
  }

  function buildWikiBlock(title, data, isDiff) {
    var lines = [];
    lines.push('#region(close,' + wikiSafe(title || (isDiff ? '差分モーション' : 'モーション一覧')) + ')');
    lines.push('|BGCOLOR(#F5FFFA):CENTER:110|BGCOLOR(#F5FFFA):CENTER:40|BGCOLOR(#F5FFFA):LEFT:1000|BGCOLOR(#F5FFFA):CENTER:65|c');

    pushBattleAndSkill(lines, data, isDiff);

    if (hasAnyMotion(data)) {
      lines.push('|>|>|BGCOLOR(#E6E6FA):CENTER:Battle Motion|BGCOLOR(#E6E6FA):CENTER:Hit|');
      cardKinds.forEach(function (kind) { pushCardRows(lines, data, kind); });
      pushSpecialRows(lines, data, 'ex');
      pushSpecialRows(lines, data, 'np');
    }

    lines.push('');
    lines.push('');
    lines.push('#endregion()');
    return lines.join('\n');
  }

  function addSpecialVariant(groupIndex, kind, forcedIndex) {
    var group = root.querySelector('.ra-group[data-group="' + groupIndex + '"]');
    var list = group.querySelector('[data-special-list="' + kind + '"]');
    var rows = Array.prototype.slice.call(list.querySelectorAll('[data-special-row="' + kind + '"]'));
    var nextIndex = forcedIndex || (rows.reduce(function (max, row) {
      return Math.max(max, Number(row.getAttribute('data-index')) || 0);
    }, 0) + 1);

    if (list.querySelector('[data-special-row="' + kind + '"][data-index="' + nextIndex + '"]')) return;
    var holder = document.createElement('div');
    holder.innerHTML = specialVariantHtml(kind, nextIndex);
    list.appendChild(holder.firstChild);
    updateSpecialRemoveButtons(groupIndex, kind);
  }

  function removeSpecialVariant(button) {
    var row = button.closest('[data-special-row]');
    var group = button.closest('.ra-group');
    var kind = row.getAttribute('data-special-row');
    var groupIndex = Number(group.getAttribute('data-group'));
    var list = group.querySelector('[data-special-list="' + kind + '"]');
    var rows = list.querySelectorAll('[data-special-row="' + kind + '"]');
    if (rows.length <= 1) {
      Array.prototype.forEach.call(row.querySelectorAll('[data-key]'), function (el) { el.value = ''; });
      return;
    }
    row.parentNode.removeChild(row);
    updateSpecialRemoveButtons(groupIndex, kind);
  }

  function updateSpecialRemoveButtons(groupIndex, kind) {
    var group = root.querySelector('.ra-group[data-group="' + groupIndex + '"]');
    var rows = group.querySelectorAll('[data-special-row="' + kind + '"]');
    Array.prototype.forEach.call(rows, function (row) {
      var button = row.querySelector('[data-remove-special]');
      button.style.display = rows.length > 1 ? '' : 'none';
    });
  }

  function migrateSavedData(data) {
    for (var g = 1; g <= MAX_GROUPS; g++) {
      ['ex', 'np'].forEach(function (kind) {
        var oldMotion = 'g' + g + '_' + kind;
        var oldHit = oldMotion + 'Hit';
        var newMotion = 'g' + g + '_' + kind + '1';
        var newHit = newMotion + 'Hit';
        if (Object.prototype.hasOwnProperty.call(data, oldMotion) && !Object.prototype.hasOwnProperty.call(data, newMotion)) {
          data[newMotion] = data[oldMotion];
        }
        if (Object.prototype.hasOwnProperty.call(data, oldHit) && !Object.prototype.hasOwnProperty.call(data, newHit)) {
          data[newHit] = data[oldHit];
        }
      });
    }
    return data;
  }

  function ensureSpecialRowsForRestore(data) {
    for (var g = 1; g <= MAX_GROUPS; g++) {
      ['ex', 'np'].forEach(function (kind) {
        var maxIndex = 1;
        var re = new RegExp('^g' + g + '_' + kind + '(\\d+)(?:Hit)?$');
        Object.keys(data).forEach(function (key) {
          var match = key.match(re);
          if (match) maxIndex = Math.max(maxIndex, Number(match[1]));
        });
        for (var i = 2; i <= maxIndex; i++) addSpecialVariant(g, kind, i);
      });
    }
  }

  function allFieldElements() {
    return Array.prototype.slice.call(root.querySelectorAll('input, textarea'));
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
    setStatus('生成しました。未入力のスキル・Q/A/B行は通常/差分とも省略しています。');
  }

  function restore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        for (var g = 1; g <= MAX_GROUPS; g++) {
          updateSpecialRemoveButtons(g, 'ex');
          updateSpecialRemoveButtons(g, 'np');
        }
        return;
      }
      var data = migrateSavedData(JSON.parse(raw));
      ensureSpecialRowsForRestore(data);
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
      for (var g = 1; g <= MAX_GROUPS; g++) {
        updateSpecialRemoveButtons(g, 'ex');
        updateSpecialRemoveButtons(g, 'np');
      }
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

  function resetSpecialRows(groupIndex, kind) {
    var group = root.querySelector('.ra-group[data-group="' + groupIndex + '"]');
    var list = group.querySelector('[data-special-list="' + kind + '"]');
    var rows = Array.prototype.slice.call(list.querySelectorAll('[data-special-row="' + kind + '"]'));
    rows.forEach(function (row, idx) {
      if (idx === 0) {
        row.setAttribute('data-index', '1');
        Array.prototype.forEach.call(row.querySelectorAll('[data-key]'), function (el) {
          var suffix = /Hit$/.test(el.getAttribute('data-key')) ? 'Hit' : '';
          el.setAttribute('data-key', kind + '1' + suffix);
          el.value = '';
        });
        row.querySelector('.ra-motion-name').textContent = (kind === 'ex' ? 'EX' : '宝具') + ' 1';
      } else row.parentNode.removeChild(row);
    });
    updateSpecialRemoveButtons(groupIndex, kind);
  }

  function clearAll() {
    if (!window.confirm('入力内容と保存データをすべて消去します。よろしいですか？')) return;
    localStorage.removeItem(STORAGE_KEY);

    for (var g = 1; g <= MAX_GROUPS; g++) {
      resetSpecialRows(g, 'ex');
      resetSpecialRows(g, 'np');
    }

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

  root.addEventListener('click', function (event) {
    var add = event.target.closest('[data-add-special]');
    if (add && root.contains(add)) {
      var group = add.closest('.ra-group');
      addSpecialVariant(Number(group.getAttribute('data-group')), add.getAttribute('data-add-special'));
      return;
    }

    var remove = event.target.closest('[data-remove-special]');
    if (remove && root.contains(remove)) removeSpecialVariant(remove);
  });

  for (var i = 2; i <= MAX_GROUPS; i++) {
    root.querySelector('#ra-enable-' + i).addEventListener('change', applyGroupVisibility);
  }

  restore();
  applyGroupVisibility();
}());