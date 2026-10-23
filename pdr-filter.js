(function () {
  'use strict';

  if (window.__pdrFilterInstalled) return;
  window.__pdrFilterInstalled = true;

  var CONFIG = {
    // العمود اللي فيه اسم الموظف اللي عمل الـ PDR
    columnHeader: 'Created by',

    // قائمة اختيارية بالأسماء المهمة. الأسماء اللي عندها PDRs بتظهر تلقائيًا
    // حتى لو مش موجودة هنا، والأسماء اللي عددها 0 متظهرش.
    employees: [],

    persist: true,
    // يبدأ بـ "All employees" لما تفتح الصفحة من جديد،
    // لكن يحتفظ بالفلتر بعد الريفريش أو بعد الموافقة على PDR.
    resetOnNewVisit: true,
    storageKey: 'pdrFilter.selectedEmployee.v1',
    keepKey: 'pdrFilter.keepOnLoad.v1',
    guardApproveAll: true,

    // أي اسم موجود في عمود Created by بيتضاف للقائمة تلقائيًا،
    // حتى لو مش من الأسماء المكتوبة فوق.
    includeUnlistedCreators: true
  };

  var S = {
    table: null,
    column: 6,
    rows: [],
    selectedKey: null,
    selectedLabel: null,
    root: null,
    button: null,
    panel: null,
    list: null,
    search: null,
    badge: null,
    empty: null,
    status: null,
    statusText: null,
    statusClear: null,
    bulkBtn: null,
    bulkRunning: false,
    selectAll: null,
    selectAllWrap: null,
    selectAllText: null,
    selectedIds: {},
    canApprove: false,
    approveAll: null,
    approveNote: null,
    approveWasDisabled: false
  };

  var ICON =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3 5h18l-7 8.2V19l-4 2v-7.8L3 5z"/></svg>';

  var CSS = `
#pdrf-root, #pdrf-root *, .pdrf-status, .pdrf-status * { box-sizing: border-box; }

#pdrf-root {
  position: fixed;
  right: 22px;
  top: 50%;
  margin-top: -22px;
  z-index: 2147483500;
  direction: ltr;
  font-family: "Open Sans", "Segoe UI", Tahoma, Arial, sans-serif;
  line-height: normal;
  -webkit-font-smoothing: antialiased;
}

#pdrf-root .pdrf-btn {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  padding: 11px 17px;
  border: 2px solid #702283;
  border-radius: 999px;
  background: linear-gradient(135deg, #82309c 0%, #702283 55%, #571667 100%);
  color: #fff;
  font: 600 15px/1 "Open Sans", "Segoe UI", Tahoma, Arial, sans-serif;
  letter-spacing: .2px;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(88, 22, 103, .35);
  transition: background .22s ease, color .22s ease, box-shadow .22s ease, transform .12s ease;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}
#pdrf-root .pdrf-btn:hover,
#pdrf-root .pdrf-btn:focus-visible {
  background: #fff;
  color: #702283;
  box-shadow: 0 10px 26px rgba(112, 34, 131, .30);
}
#pdrf-root .pdrf-btn:active { transform: scale(.97); }
#pdrf-root .pdrf-btn svg { display: block; flex: none; }
#pdrf-root .pdrf-btn-label { display: block; line-height: 1; }

#pdrf-root.pdrf-active .pdrf-btn {
  box-shadow: 0 0 0 4px rgba(112, 34, 131, .16), 0 10px 26px rgba(88, 22, 103, .42);
}

#pdrf-root .pdrf-badge {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #fff;
  color: #702283;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}
#pdrf-root .pdrf-badge[hidden] { display: none; }
#pdrf-root .pdrf-btn:hover .pdrf-badge { background: #702283; color: #fff; }

/* ---------- panel ---------- */
#pdrf-root .pdrf-panel {
  position: absolute;
  top: 50%;
  right: calc(100% + 16px);
  width: 380px;
  max-width: calc(100vw - 130px);
  margin: 0;
  padding: 0;
  background: #fff;
  border: 1px solid #e7daec;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(56, 17, 66, .24), 0 2px 8px rgba(56, 17, 66, .08);
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(-50%) translateX(14px) scale(.97);
  transform-origin: right center;
  transition: opacity .16s ease, transform .16s ease, visibility .16s;
  text-align: left;
}
#pdrf-root.pdrf-open .pdrf-panel {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(-50%) translateX(0) scale(1);
}

#pdrf-root .pdrf-head {
  position: relative;
  padding: 15px 44px 13px 18px;
  background: linear-gradient(135deg, #7f2d96, #702283 60%, #5f1b72);
  color: #fff;
}
#pdrf-root .pdrf-head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: .2px;
  line-height: 1.3;
  color: #fff;
}
#pdrf-root .pdrf-head p {
  margin: 3px 0 0;
  font-size: 11.5px;
  line-height: 1.4;
  color: rgba(255, 255, 255, .82);
}
#pdrf-root .pdrf-close {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, .16);
  color: #fff;
  font: 400 18px/1 Arial, sans-serif;
  cursor: pointer;
  transition: background .15s;
}
#pdrf-root .pdrf-close:hover { background: rgba(255, 255, 255, .32); }
#pdrf-root .pdrf-close:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

#pdrf-root .pdrf-search { padding: 12px 14px 6px; background: #fff; }
#pdrf-root .pdrf-search input {
  width: 100%;
  margin: 0;
  padding: 8px 12px;
  border: 1px solid #ddcfe4;
  border-radius: 10px;
  background: #fbf9fc;
  color: #3b2a41;
  font: 400 12.5px/1.4 "Open Sans", "Segoe UI", Tahoma, Arial, sans-serif;
  outline: none;
  box-shadow: none;
  transition: border-color .15s, box-shadow .15s, background .15s;
}
#pdrf-root .pdrf-search input:focus {
  border-color: #702283;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(112, 34, 131, .12);
}
#pdrf-root .pdrf-search input::placeholder { color: #a598ae; }

#pdrf-root .pdrf-list {
  max-height: min(64vh, 520px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 2px 8px 10px;
  background: #fff;
  scrollbar-width: thin;
}
#pdrf-root .pdrf-list::-webkit-scrollbar { width: 8px; }
#pdrf-root .pdrf-list::-webkit-scrollbar-thumb { background: #dccbe3; border-radius: 8px; }

#pdrf-root .pdrf-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin: 0;
  padding: 9px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #3a2b40;
  font: 400 12.8px/1.35 "Open Sans", "Segoe UI", Tahoma, Arial, sans-serif;
  text-align: left;
  cursor: pointer;
  transition: background .13s;
}
#pdrf-root .pdrf-item:hover { background: #f7f0f9; }
#pdrf-root .pdrf-item.pdrf-sel { background: #f2e6f6; color: #4a1a58; font-weight: 600; }
#pdrf-root .pdrf-item[hidden] { display: none; }
#pdrf-root .pdrf-item:focus-visible { outline: 2px solid #702283; outline-offset: -2px; }

#pdrf-root .pdrf-dot {
  flex: none;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 2px solid #cbb3d5;
  background: #fff;
  position: relative;
}
#pdrf-root .pdrf-item.pdrf-sel .pdrf-dot { border-color: #702283; }
#pdrf-root .pdrf-item.pdrf-sel .pdrf-dot::after {
  content: "";
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: #702283;
}
#pdrf-root .pdrf-name { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
#pdrf-root .pdrf-count {
  flex: none;
  padding: 2px 7px;
  border-radius: 999px;
  background: #f1ecf4;
  color: #7c6a86;
  font-size: 10.5px;
  font-weight: 600;
}
#pdrf-root .pdrf-item.pdrf-sel .pdrf-count { background: #702283; color: #fff; }

#pdrf-root .pdrf-sep { height: 1px; margin: 4px 10px 6px; background: #efe6f2; }
#pdrf-root .pdrf-empty { padding: 10px 12px 14px; text-align: center; color: #8b7a95; font-size: 12px; }
#pdrf-root .pdrf-empty[hidden] { display: none; }

/* ---------- active-filter bar above the table ---------- */
.pdrf-status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
  width: fit-content;
  max-width: 78%;
  margin: 0 0 14px 15px;
  padding: 9px 14px;
  background: #f8f1fb;
  border: 1px solid #e5d4ec;
  border-left: 4px solid #702283;
  border-radius: 10px;
  color: #4a2c55;
  font: 400 12.5px/1.45 "Open Sans", "Segoe UI", Tahoma, Arial, sans-serif;
}
.pdrf-status b { color: #702283; font-weight: 700; }
.pdrf-status[hidden] { display: none !important; }
.pdrf-status button {
  margin: 0 0 0 4px;
  padding: 4px 10px;
  border: 1px solid #702283;
  border-radius: 999px;
  background: #fff;
  color: #702283;
  font: 600 11.5px/1.2 "Open Sans", "Segoe UI", Tahoma, Arial, sans-serif;
  cursor: pointer;
}
.pdrf-status button:hover { background: #702283; color: #fff; }
.pdrf-status button.pdrf-bulk {
  margin: 0;
  padding: 5px 12px;
  border: 1px solid #702283;
  border-radius: 999px;
  background: #702283;
  color: #fff;
  font: 600 11.5px/1.2 "Open Sans", "Segoe UI", Tahoma, Arial, sans-serif;
  cursor: pointer;
}
.pdrf-status button.pdrf-bulk:hover { background: #5a1a6b; color: #fff; }
.pdrf-status button.pdrf-bulk:disabled { opacity: .55; cursor: progress; }
.pdrf-status .pdrf-select-all {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  padding: 2px 4px;
  color: #4a2c55;
  font: 600 11.5px/1.2 "Open Sans", "Segoe UI", Tahoma, Arial, sans-serif;
  cursor: pointer;
  user-select: none;
}
.pdrf-status .pdrf-select-all[hidden] { display: none; }
.pdrf-status .pdrf-select-all input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: #702283;
  cursor: pointer;
}
/* per-row select pill, in the Name cell before the employee name */
table td.pdrf-name-cell { position: relative; }
table.pdrf-selecting td.pdrf-name-cell { padding-left: 90px !important; }
table .pdrf-check {
  display: none;
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 66px;
  height: 24px;
  margin: 0;
  padding: 0 7px;
  border: 1px solid #d7c2df;
  border-radius: 999px;
  background: #fbf7fd;
  color: #6b4a78;
  font: 600 10px/1 "Open Sans", "Segoe UI", Tahoma, Arial, sans-serif;
  cursor: pointer;
  user-select: none;
  transition: background .15s, border-color .15s, color .15s;
}
table.pdrf-selecting .pdrf-check { display: inline-flex; }
table .pdrf-check:hover { background: #f1e5f6; border-color: #b98cc9; color: #5a1a6b; }
table .pdrf-check.is-sel { background: #702283; border-color: #702283; color: #fff; }
table .pdrf-check input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  margin: 0;
}
table .pdrf-check .pdrf-check-box {
  width: 14px;
  height: 14px;
  flex: none;
  border: 2px solid #b98cc9;
  border-radius: 4px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .15s, border-color .15s;
}
table .pdrf-check .pdrf-check-box::after {
  content: "";
  width: 3px;
  height: 7px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) translateY(-1px);
  opacity: 0;
}
table .pdrf-check input:checked + .pdrf-check-box { background: #702283; border-color: #702283; }
table .pdrf-check input:checked + .pdrf-check-box::after { opacity: 1; }
table .pdrf-check input:focus-visible + .pdrf-check-box { outline: 2px solid #702283; outline-offset: 2px; }
table .pdrf-check.is-sel .pdrf-check-box { background: #fff; border-color: #fff; }
table .pdrf-check.is-sel .pdrf-check-box::after { border-color: #702283; opacity: 1; }

/* ---------- safety notice for "Approve All PDRs" ---------- */
.pdrf-approve-note {
  margin: 8px auto 0;
  max-width: 560px;
  padding: 8px 12px;
  border: 1px dashed #b07bc0;
  border-radius: 8px;
  background: #fbf6fd;
  color: #5f2a6e;
  font: 400 12px/1.5 "Open Sans", "Segoe UI", Tahoma, Arial, sans-serif;
  text-align: center;
}
.pdrf-approve-note[hidden] { display: none !important; }
input.pdrf-approve-disabled { opacity: .45 !important; cursor: not-allowed !important; }

table.pdrf-table tr.pdrf-hidden { display: none !important; }

@media (max-width: 720px) {
  #pdrf-root { right: 12px; }
  #pdrf-root .pdrf-panel {
    position: fixed;
    top: auto;
    bottom: 12px;
    right: 12px;
    left: 12px;
    width: auto;
    max-width: none;
    transform: translateY(14px) scale(.98);
  }
  #pdrf-root.pdrf-open .pdrf-panel { transform: translateY(0) scale(1); }
  #pdrf-root .pdrf-list { max-height: 56vh; }
  .pdrf-status { max-width: calc(100% - 30px); }
}

@media print {
  #pdrf-root, .pdrf-status, .pdrf-approve-note, .pdrf-check { display: none !important; }
}
`;

  function norm(value) {
    return String(value == null ? '' : value)
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function makeBold(value) {
    var b = document.createElement('b');
    b.textContent = String(value);
    return b;
  }

  function cellText(row, column) {
    var cell = row.cells && row.cells[column];
    return cell ? cell.textContent : '';
  }

  function isRowVisible(row) {
    return row.style.display !== 'none' && !row.hidden;
  }

  function findPdrTable() {
    var wanted = norm(CONFIG.columnHeader);
    var tables = document.getElementsByTagName('table');
    for (var i = 0; i < tables.length; i++) {
      var table = tables[i];
      if (!table.rows || !table.rows.length) continue;
      var head = table.rows[0];
      if (!head.cells || !head.cells.length) continue;
      var column = -1;
      for (var j = 0; j < head.cells.length; j++) {
        if (norm(head.cells[j].textContent) === wanted) {
          column = j;
          break;
        }
      }
      if (column === -1) continue;
      if (norm(head.textContent).indexOf('action') === -1) continue;
      return { table: table, column: column };
    }
    return null;
  }

  function collectRows() {
    var rows = [];
    var all = S.table.rows;
    for (var i = 0; i < all.length; i++) {
      var row = all[i];
      if (i === 0) continue;
      if (!row.cells || row.cells.length <= S.column) continue;
      var isDataRow = row.querySelector('input[name="pdr_id"]') || /^\d+$/.test(row.id || '');
      if (!isDataRow) continue;
      rows.push(row);
    }
    return rows;
  }

  function getEmployees() {
    var seen = {};
    var list = [];

    function push(name) {
      var label = clean(name);
      var key = norm(label);
      if (!label || seen[key]) return;
      seen[key] = true;
      list.push({ key: key, label: label });
    }

    // Optional seed list; names with PDRs are discovered from the table too.
    CONFIG.employees.forEach(push);
    if (CONFIG.includeUnlistedCreators) {
      S.rows.forEach(function (row) {
        push(cellText(row, S.column));
      });
    }

    // Only employees that actually have PDRs, sorted alphabetically.
    return list
      .filter(function (employee) {
        return countFor(employee.key) > 0;
      })
      .sort(function (a, b) {
        return a.label.toLowerCase().localeCompare(b.label.toLowerCase());
      });
  }

  function countFor(key) {
    var total = 0;
    for (var i = 0; i < S.rows.length; i++) {
      if (isRowVisible(S.rows[i]) && norm(cellText(S.rows[i], S.column)) === key) total++;
    }
    return total;
  }

  function totalVisible() {
    var total = 0;
    for (var i = 0; i < S.rows.length; i++) {
      if (isRowVisible(S.rows[i])) total++;
    }
    return total;
  }

  function matchesSelected(row) {
    return !S.selectedKey || norm(cellText(row, S.column)) === S.selectedKey;
  }

  function injectStyle() {
    if (document.getElementById('pdrf-style')) return;
    var style = document.createElement('style');
    style.id = 'pdrf-style';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function buildUI() {
    var root = el('div', 'pdrf-root');
    root.id = 'pdrf-root';

    var button = el('button', 'pdrf-btn');
    button.type = 'button';
    button.id = 'pdrf-btn';
    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Filter PDRs by employee');
    button.title = 'Filter PDRs by employee';
    button.innerHTML =
      ICON +
      '<span class="pdrf-btn-label">Filter</span>' +
      '<span class="pdrf-badge" hidden>0</span>';

    button.addEventListener('click', function (event) {
      event.stopPropagation();
      if (root.classList.contains('pdrf-open')) closePanel();
      else openPanel();
    });

    var panel = el('div', 'pdrf-panel');
    panel.id = 'pdrf-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Filter PDRs by employee');

    var head = el('div', 'pdrf-head');
    head.appendChild(el('h3', null, 'Filter by employee'));
    head.appendChild(el('p', null, 'Select one employee to see only the PDRs they created.'));

    var closeBtn = el('button', 'pdrf-close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close filter');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', closePanel);
    head.appendChild(closeBtn);

    var searchWrap = el('div', 'pdrf-search');
    var search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Search employee…';
    search.setAttribute('aria-label', 'Search employee');
    search.addEventListener('input', function () {
      filterItems(search.value);
    });
    searchWrap.appendChild(search);

    var list = el('div', 'pdrf-list');
    list.id = 'pdrf-list';
    list.setAttribute('role', 'radiogroup');
    list.setAttribute('aria-label', 'Employees');

    var empty = el('div', 'pdrf-empty', 'No employee matches that search.');
    empty.hidden = true;

    panel.appendChild(head);
    panel.appendChild(searchWrap);
    panel.appendChild(list);

    root.appendChild(button);
    root.appendChild(panel);
    document.body.appendChild(root);

    S.root = root;
    S.button = button;
    S.panel = panel;
    S.list = list;
    S.search = search;
    S.badge = button.querySelector('.pdrf-badge');
    S.empty = empty;
  }

  function makeItem(key, label, count, selected) {
    var item = el('button', 'pdrf-item');
    item.type = 'button';
    item.setAttribute('role', 'radio');
    item.setAttribute('aria-checked', selected ? 'true' : 'false');
    item.dataset.key = key;
    item.dataset.name = norm(label);
    if (selected) item.classList.add('pdrf-sel');

    item.appendChild(el('span', 'pdrf-dot'));
    item.appendChild(el('span', 'pdrf-name', label));
    item.appendChild(el('span', 'pdrf-count', String(count)));
    item.title = label + ' — ' + count + ' PDR' + (count === 1 ? '' : 's');

    item.addEventListener('click', function () {
      applyFilter(key ? label : null, true);
      closePanel();
      try {
        S.button.focus({ preventScroll: true });
      } catch (e) {
        S.button.focus();
      }
    });
    return item;
  }

  function rebuildList() {
    if (!S.list) return;
    S.list.textContent = '';
    S.list.appendChild(makeItem('', 'All employees', totalVisible(), !S.selectedKey));
    S.list.appendChild(el('div', 'pdrf-sep'));

    var employees = getEmployees();
    for (var i = 0; i < employees.length; i++) {
      var employee = employees[i];
      S.list.appendChild(
        makeItem(employee.key, employee.label, countFor(employee.key), S.selectedKey === employee.key)
      );
    }

    S.list.appendChild(S.empty);
    S.empty.hidden = true;
    S.search.value = '';
  }

  function filterItems(query) {
    if (!S.list) return;
    var needle = norm(query);
    var items = S.list.querySelectorAll('.pdrf-item');
    var hits = 0;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var isAll = !item.dataset.key;
      var show = isAll || !needle || item.dataset.name.indexOf(needle) !== -1;
      item.hidden = !show;
      if (!isAll && show) hits++;
    }

    S.empty.hidden = !needle || hits > 0;
  }

  function syncItems() {
    if (!S.list) return;
    var items = S.list.querySelectorAll('.pdrf-item');
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var selected = (item.dataset.key || '') === (S.selectedKey || '');
      item.classList.toggle('pdrf-sel', selected);
      item.setAttribute('aria-checked', selected ? 'true' : 'false');
    }
  }

  function openPanel() {
    if (!S.root) return;
    rebuildList();
    filterItems('');
    S.root.classList.add('pdrf-open');
    S.button.setAttribute('aria-expanded', 'true');

    var selectedItem = S.list.querySelector('.pdrf-sel');
    if (selectedItem) {
      var listBox = S.list.getBoundingClientRect();
      var itemBox = selectedItem.getBoundingClientRect();
      if (itemBox.top < listBox.top) S.list.scrollTop -= listBox.top - itemBox.top + 8;
      else if (itemBox.bottom > listBox.bottom) S.list.scrollTop += itemBox.bottom - listBox.bottom + 8;
    }

    if (window.innerWidth > 720) {
      try {
        S.search.focus({ preventScroll: true });
      } catch (e) {
        try {
          S.search.focus();
        } catch (e2) {
          /* ignore */
        }
      }
    }
  }

  function closePanel() {
    if (!S.root) return;
    S.root.classList.remove('pdrf-open');
    S.button.setAttribute('aria-expanded', 'false');
  }

  function rowId(row) {
    var input = row.querySelector('input[name="pdr_id"]');
    return input ? input.value : row.id;
  }

  function rowSelected(row) {
    return !!S.selectedIds[rowId(row)];
  }

  function countSelected() {
    var count = 0;
    for (var i = 0; i < S.rows.length; i++) {
      var row = S.rows[i];
      if (matchesSelected(row) && isRowVisible(row) && rowSelected(row)) count++;
    }
    return count;
  }

  function syncCheckVisual(box) {
    var label = box.closest('.pdrf-check');
    if (!label) return;
    label.classList.toggle('is-sel', box.checked);
    var caption = label.querySelector('.pdrf-check-caption');
    if (caption) caption.textContent = box.checked ? 'Selected' : 'Select';
  }

  function clearSelection() {
    S.selectedIds = {};
    if (!S.table) return;
    var boxes = S.table.querySelectorAll('.pdrf-check input');
    for (var i = 0; i < boxes.length; i++) {
      boxes[i].checked = false;
      syncCheckVisual(boxes[i]);
    }
    if (S.selectAll) {
      S.selectAll.checked = false;
      S.selectAll.indeterminate = false;
    }
  }

  function onRowCheck(event) {
    var box = event.target;
    if (box.checked) S.selectedIds[box.value] = true;
    else delete S.selectedIds[box.value];
    syncCheckVisual(box);
    syncUI();
  }

  function onSelectAllChange() {
    var on = !!(S.selectAll && S.selectAll.checked);
    var boxes = S.table.querySelectorAll('.pdrf-check input');
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      var row = box.closest('tr');
      if (!row || !matchesSelected(row) || !isRowVisible(row)) continue;
      box.checked = on;
      syncCheckVisual(box);
      if (on) S.selectedIds[box.value] = true;
      else delete S.selectedIds[box.value];
    }
    syncUI();
  }

  function setupRowCheckboxes() {
    if (!S.canApprove) return;
    var header = S.table.rows[0];
    if (!header) return;

    var nameCol = -1;
    for (var c = 0; c < header.cells.length; c++) {
      if (norm(header.cells[c].textContent) === 'name') {
        nameCol = c;
        break;
      }
    }
    if (nameCol === -1) nameCol = 2;

    header.cells[nameCol].classList.add('pdrf-name-cell');

    for (var i = 0; i < S.rows.length; i++) {
      var row = S.rows[i];
      var cell = row.cells[nameCol];
      if (!cell || cell.querySelector('.pdrf-check')) continue;
      cell.classList.add('pdrf-name-cell');

      var id = rowId(row);
      if (!id) continue;

      var label = el('label', 'pdrf-check');
      label.title = 'Select this PDR';
      var box = document.createElement('input');
      box.type = 'checkbox';
      box.value = id;
      box.setAttribute('aria-label', 'Select PDR ' + id);
      box.addEventListener('change', onRowCheck);
      label.appendChild(box);
      label.appendChild(el('span', 'pdrf-check-box'));
      label.appendChild(el('span', 'pdrf-check-caption', 'Select'));
      cell.appendChild(label);
    }
  }

  function applyFilter(label, save) {
    var key = label ? norm(label) : null;
    S.selectedKey = key || null;
    S.selectedLabel = null;

    if (key) {
      for (var i = 0; i < S.rows.length; i++) {
        if (norm(cellText(S.rows[i], S.column)) === key) {
          S.selectedLabel = clean(cellText(S.rows[i], S.column));
          break;
        }
      }
      if (!S.selectedLabel) S.selectedLabel = clean(label);
    }

    clearSelection();
    S.table.classList.toggle('pdrf-selecting', !!S.selectedKey && S.canApprove);

    for (var j = 0; j < S.rows.length; j++) {
      var row = S.rows[j];
      var show = !S.selectedKey || norm(cellText(row, S.column)) === S.selectedKey;
      row.classList.toggle('pdrf-hidden', !show);
    }

    syncUI();
    if (save && CONFIG.persist) saveSelection();
  }

  function postApprove(pdrId) {
    var body = 'pdr_id=' + encodeURIComponent(pdrId) + '&approve_pdr=Approve';
    return fetch(window.location.href, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body
    }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      if (/login/i.test(response.url || '')) throw new Error('Session expired');
    });
  }

  async function approveSelected() {
    if (S.bulkRunning) return;

    var targets = [];
    for (var i = 0; i < S.rows.length; i++) {
      var row = S.rows[i];
      if (matchesSelected(row) && isRowVisible(row) && rowSelected(row)) targets.push(row);
    }
    if (!targets.length) return;

    var total = targets.length;
    var proceed = window.confirm(
      'Approve ' + total + ' selected PDR' + (total === 1 ? '' : 's') +
        ' created by "' + (S.selectedLabel || '') + '"?\n\n' +
        'They will be approved one by one. This cannot be undone from here.'
    );
    if (!proceed) return;

    S.bulkRunning = true;
    S.bulkBtn.disabled = true;
    S.selectAll.disabled = true;
    S.statusClear.disabled = true;
    S.bulkBtn.textContent = 'Approving 0/' + total + '…';

    var done = 0;
    try {
      for (var j = 0; j < targets.length; j++) {
        var input = targets[j].querySelector('input[name="pdr_id"]');
        if (input) await postApprove(input.value);
        done++;
        S.bulkBtn.textContent = 'Approving ' + done + '/' + total + '…';
      }
      S.bulkBtn.textContent = 'Approved ' + total + '/' + total + ' ✓';
      markKeepOnLoad();
      setTimeout(function () {
        window.location.reload();
      }, 900);
    } catch (error) {
      S.bulkRunning = false;
      S.bulkBtn.disabled = false;
      S.selectAll.disabled = false;
      S.statusClear.disabled = false;
      S.bulkBtn.textContent = 'Approve selected (' + Math.max(0, total - done) + ')';
      S.statusText.textContent =
        'Approval stopped after ' + done + ' of ' + total + '. Refresh to see the current state.';
    }
  }

  function updateStatus(shown, total) {
    if (!S.status) return;
    if (!S.selectedKey) {
      S.status.hidden = true;
      return;
    }

    S.status.hidden = false;
    S.statusText.textContent = '';
    S.statusText.appendChild(document.createTextNode('Showing '));
    S.statusText.appendChild(makeBold(shown));
    S.statusText.appendChild(document.createTextNode(' of '));
    S.statusText.appendChild(makeBold(total));
    S.statusText.appendChild(
      document.createTextNode(' PDR' + (total === 1 ? '' : 's') + ' — created by ')
    );
    S.statusText.appendChild(makeBold(S.selectedLabel || ''));

    var selected = countSelected();
    if (S.selectAllWrap) {
      S.selectAllWrap.hidden = false;
      if (S.selectAllText) S.selectAllText.textContent = 'Select all (' + shown + ')';
      if (S.selectAll) {
        S.selectAll.disabled = shown === 0 || S.bulkRunning;
        S.selectAll.checked = shown > 0 && selected === shown;
        S.selectAll.indeterminate = selected > 0 && selected < shown;
      }
    }
    if (S.bulkBtn && !S.bulkRunning) {
      S.bulkBtn.hidden = false;
      S.bulkBtn.disabled = selected === 0;
      S.bulkBtn.textContent = 'Approve selected (' + selected + ')';
    }
  }

  function syncUI() {
    var active = !!S.selectedKey;
    if (S.root) S.root.classList.toggle('pdrf-active', active);

    var shown = 0;
    var total = 0;
    for (var i = 0; i < S.rows.length; i++) {
      var row = S.rows[i];
      if (!isRowVisible(row)) continue;
      total++;
      if (matchesSelected(row)) shown++;
    }

    if (S.badge) {
      S.badge.hidden = !active;
      S.badge.textContent = String(shown);
    }

    updateStatus(shown, total);
    syncApproveAll();
    syncItems();
  }

  function ensureStatus() {
    if (S.status) return;
    var bar = el('div', 'pdrf-status');
    bar.hidden = true;

    var text = el('span', 'pdrf-status-text');

    var selectWrap = null;
    var selectAll = null;
    var selectText = null;
    var bulk = null;

    if (S.canApprove) {
      selectWrap = el('label', 'pdrf-select-all');
      selectAll = document.createElement('input');
      selectAll.type = 'checkbox';
      selectAll.addEventListener('change', onSelectAllChange);
      selectText = el('span', null, 'Select all (0)');
      selectWrap.appendChild(selectAll);
      selectWrap.appendChild(selectText);
      selectWrap.hidden = true;

      bulk = el('button', 'pdrf-bulk', 'Approve selected (0)');
      bulk.type = 'button';
      bulk.hidden = true;
      bulk.addEventListener('click', approveSelected);
    }

    var clear = el('button', 'pdrf-status-clear', 'Show all');
    clear.type = 'button';
    clear.addEventListener('click', function () {
      applyFilter(null, true);
    });

    bar.appendChild(text);
    if (selectWrap) bar.appendChild(selectWrap);
    if (bulk) bar.appendChild(bulk);
    bar.appendChild(clear);
    S.table.parentNode.insertBefore(bar, S.table);

    S.status = bar;
    S.statusText = text;
    S.statusClear = clear;
    S.bulkBtn = bulk;
    S.selectAll = selectAll;
    S.selectAllWrap = selectWrap;
    S.selectAllText = selectText;
  }

  function setupApproveAll() {
    var input = document.querySelector('input[name="approve_all_pdr"]');
    if (!input) return;

    S.approveAll = input;
    S.approveWasDisabled = input.disabled;

    var note = el(
      'div',
      'pdrf-approve-note',
      'Filter is active: “Approve All PDRs” is disabled because it approves every employee’s PDRs. Use “Select all” and “Approve selected” above the table to approve only this employee’s PDRs.'
    );
    note.hidden = true;

    if (input.form) input.form.insertAdjacentElement('afterend', note);
    else input.insertAdjacentElement('afterend', note);
    S.approveNote = note;

    var form = input.form;
    if (form) {
      form.addEventListener(
        'submit',
        function (event) {
          if (!S.selectedKey) return;
          var proceed = window.confirm(
            'The employee filter is still active.\n\n' +
              '"Approve All PDRs" approves ALL PDRs, not only the filtered ones.\n\n' +
              'Continue anyway?'
          );
          if (!proceed) {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
        },
        true
      );
    }
  }

  function syncApproveAll() {
    if (!S.approveAll) return;
    var block = !!S.selectedKey && CONFIG.guardApproveAll;
    S.approveAll.disabled = block || S.approveWasDisabled;
    S.approveAll.classList.toggle('pdrf-approve-disabled', block);
    if (block) {
      S.approveAll.setAttribute(
        'title',
        'Disabled while the employee filter is active — it would approve everyone.'
      );
    } else {
      S.approveAll.removeAttribute('title');
    }
    if (S.approveNote) S.approveNote.hidden = !block;
  }

  function saveSelection() {
    try {
      if (S.selectedKey) localStorage.setItem(CONFIG.storageKey, S.selectedLabel || '');
      else localStorage.removeItem(CONFIG.storageKey);
    } catch (e) {
      /* storage disabled */
    }
  }

  function clearSavedSelection() {
    try {
      localStorage.removeItem(CONFIG.storageKey);
    } catch (e) {
      /* storage disabled */
    }
  }

  function isReloadNavigation() {
    try {
      var nav = performance.getEntriesByType('navigation')[0];
      if (nav && nav.type) return nav.type === 'reload';
      return !!(performance.navigation && performance.navigation.type === 1);
    } catch (e) {
      return false;
    }
  }

  function markKeepOnLoad() {
    try {
      sessionStorage.setItem(CONFIG.keepKey, String(Date.now()));
    } catch (e) {
      /* storage disabled */
    }
  }

  function restoreSelection() {
    if (!CONFIG.persist) {
      clearSavedSelection();
      return null;
    }

    // Keep the filter across a refresh or an "Approve" reload, but start a
    // fresh visit (menu link, new tab, browser restart) on "All employees".
    var keepAt = 0;
    try {
      keepAt = parseInt(sessionStorage.getItem(CONFIG.keepKey), 10) || 0;
    } catch (e) {
      keepAt = 0;
    }
    var keepRecent = keepAt > 0 && Date.now() - keepAt < 60000;

    if (CONFIG.resetOnNewVisit && !keepRecent && !isReloadNavigation()) {
      clearSavedSelection();
      return null;
    }

    try {
      sessionStorage.removeItem(CONFIG.keepKey);
    } catch (e) {
      /* storage disabled */
    }

    var saved = '';
    try {
      saved = localStorage.getItem(CONFIG.storageKey) || '';
    } catch (e) {
      return null;
    }
    if (!saved) return null;

    var key = norm(saved);
    var employees = getEmployees();
    for (var i = 0; i < employees.length; i++) {
      if (employees[i].key === key) return saved;
    }
    clearSavedSelection();
    return null;
  }

  function setupApproveTracking() {
    // Approving a PDR reloads the same page; keep the employee filter for that
    // reload only. A fresh visit is reset by restoreSelection().
    document.addEventListener(
      'submit',
      function (event) {
        var form = event.target;
        if (!form || form.tagName !== 'FORM') return;
        if (form.querySelector('input[name="approve_pdr"]')) markKeepOnLoad();
      },
      true
    );
  }

  function setupBackForwardReset() {
    // Coming back with the browser Back button can restore the page from the
    // bfcache without running restoreSelection(); reset it here as well.
    window.addEventListener('pageshow', function (event) {
      if (!event.persisted || !CONFIG.resetOnNewVisit) return;
      clearSavedSelection();
      applyFilter(null, false);
    });
  }

  function initUI() {
    S.canApprove = !!document.querySelector(
      'input[name="approve_pdr"], input[name="approve_all_pdr"]'
    );
    S.table.classList.add('pdrf-table');
    injectStyle();
    buildUI();
    ensureStatus();
    setupApproveAll();
    setupApproveTracking();
    setupBackForwardReset();
    setupRowCheckboxes();
    applyFilter(restoreSelection(), false);

    var refresh = function () {
      setTimeout(function () {
        syncUI();
      }, 80);
    };
    if (document.readyState === 'complete') refresh();
    else window.addEventListener('load', refresh);
  }

  // Some pages render the table after this script starts: retry for ~30s.
  var bootTries = 0;
  function boot() {
    if (document.getElementById('pdrf-root')) return;

    var found = findPdrTable();
    if (found) {
      S.table = found.table;
      S.column = found.column;
      S.rows = collectRows();
      if (S.rows.length) {
        initUI();
        return;
      }
    }

    if (++bootTries < 60) setTimeout(boot, 500);
  }

  // Close the panel when clicking elsewhere, and on Escape.
  document.addEventListener(
    'click',
    function (event) {
      if (!S.root || !S.root.classList.contains('pdrf-open')) return;
      if (S.root.contains(event.target)) return;
      closePanel();
    },
    true
  );

  document.addEventListener(
    'keydown',
    function (event) {
      if (!S.root || !S.root.classList.contains('pdrf-open')) return;
      if (event.key === 'Escape' || event.key === 'Esc' || event.keyCode === 27) {
        event.stopPropagation();
        closePanel();
        try {
          S.button.focus({ preventScroll: true });
        } catch (e) {
          S.button.focus();
        }
      }
    },
    true
  );

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
