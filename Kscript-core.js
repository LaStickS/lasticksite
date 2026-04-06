(function() {
    // --------------------------------------------------------------
    // 1. Константы и справочники (музыкальная логика)
    // --------------------------------------------------------------
    const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    const KURAI_SCALES = {
        'C':  { name: 'До мажор', notes: ['C', 'D', 'E', 'F', 'G', 'A'] },
        'C#': { name: 'До-диез', notes: ['C#', 'D#', 'F', 'F#', 'G#', 'A#'] },
        'D':  { name: 'Ре мажор', notes: ['D', 'E', 'F#', 'G', 'A', 'B'] },
        'D#': { name: 'Ре-диез/Eb', notes: ['D#', 'F', 'G', 'G#', 'A#', 'C'] },
        'E':  { name: 'Ми мажор', notes: ['E', 'F#', 'G#', 'A', 'B', 'C#'] },
        'F':  { name: 'Фа мажор', notes: ['F', 'G', 'A', 'A#', 'C', 'D'] },
        'F#': { name: 'Фа-диез', notes: ['F#', 'G#', 'A#', 'B', 'C#', 'D#'] },
        'G':  { name: 'Соль мажор', notes: ['G', 'A', 'B', 'C', 'D', 'E'] },
        'G#': { name: 'Соль-диез/Ab', notes: ['G#', 'A#', 'C', 'C#', 'D#', 'F'] },
        'A':  { name: 'Ля мажор', notes: ['A', 'B', 'C#', 'D', 'E', 'F#'] },
        'A#': { name: 'Ля-диез/Bb', notes: ['A#', 'C', 'D', 'D#', 'F', 'G'] },
        'B':  { name: 'Си мажор', notes: ['B', 'C#', 'D#', 'E', 'F#', 'G#'] }
    };
    
    // Сопоставления для русских и альтернативных названий
    const NOTE_ALIASES = {
        'c': 'C', 'd': 'D', 'e': 'E', 'f': 'F', 'g': 'G', 'a': 'A', 'b': 'B',
        'c#': 'C#', 'c♯': 'C#', 'до#': 'C#', 'до♯': 'C#',
        'd#': 'D#', 'd♯': 'D#', 'ре#': 'D#', 'ре♯': 'D#',
        'f#': 'F#', 'f♯': 'F#', 'фа#': 'F#', 'фа♯': 'F#',
        'g#': 'G#', 'g♯': 'G#', 'соль#': 'G#', 'соль♯': 'G#',
        'a#': 'A#', 'a♯': 'A#', 'ля#': 'A#', 'ля♯': 'A#',
        'db': 'C#', 'd♭': 'C#', 'реb': 'C#', 'ре♭': 'C#',
        'eb': 'D#', 'e♭': 'D#', 'миb': 'D#', 'ми♭': 'D#',
        'gb': 'F#', 'g♭': 'F#', 'сольb': 'F#', 'соль♭': 'F#',
        'ab': 'G#', 'a♭': 'G#', 'ляb': 'G#', 'ля♭': 'G#',
        'bb': 'A#', 'b♭': 'A#', 'сиb': 'A#', 'си♭': 'A#',
        'до': 'C', 'ре': 'D', 'ми': 'E', 'фа': 'F', 'соль': 'G', 'ля': 'A', 'си': 'B',
        'sol': 'G', 'la': 'A', 'ti': 'B', 'si': 'B'
    };
    
    // Вспомогательные функции
    function transposeNote(note, semitones) {
        const idx = CHROMATIC.indexOf(note);
        if (idx === -1) return note;
        const newIdx = (idx + semitones + 120) % 12;
        return CHROMATIC[newIdx];
    }
    
    function getSeventhNoteAndOverblow(scaleNotes) {
        if (scaleNotes.length !== 6) return null;
        const fifthNote = scaleNotes[5];
        const idxFifth = CHROMATIC.indexOf(fifthNote);
        if (idxFifth === -1) return null;
        const seventhNote = CHROMATIC[(idxFifth + 1) % 12];
        const doubleOverblowNote = CHROMATIC[(idxFifth + 2) % 12];
        return { seventh: seventhNote, double: doubleOverblowNote };
    }
    
    // Функция для получения аппликатуры БЕЗ автоматической замены (строгий режим)
    function getExactFingering(originalNote, targetKuraiKey, baseOctave) {
        const scaleNotes = KURAI_SCALES[targetKuraiKey].notes;
        if (!scaleNotes.length) return { fingering: '?', transposed: null, wasTransposed: false, shift: 0, exactMatch: false };
        
        // Прямое попадание в основной звукоряд
        if (scaleNotes.includes(originalNote)) {
            const index = scaleNotes.indexOf(originalNote);
            let stars = '';
            if (baseOctave === 5) stars = '*';
            else if (baseOctave === 6) stars = '**';
            return { fingering: index.toString() + stars, transposed: originalNote, wasTransposed: false, shift: 0, exactMatch: true, overblowNote: false };
        }
        
        // Проверка передувов на 5-й позиции
        const fifthNote = scaleNotes[5];
        const idxFifth = CHROMATIC.indexOf(fifthNote);
        if (idxFifth !== -1) {
            const seventhNote = CHROMATIC[(idxFifth + 1) % 12];
            if (originalNote === seventhNote) {
                let stars = '*';
                if (baseOctave === 5) stars = '**';
                else if (baseOctave === 6) stars = '***';
                return { fingering: `5${stars}`, transposed: seventhNote, wasTransposed: false, shift: 0, exactMatch: true, overblowNote: true };
            }
            const doubleNote = CHROMATIC[(idxFifth + 2) % 12];
            if (originalNote === doubleNote) {
                let stars = '**';
                if (baseOctave === 5) stars = '***';
                else if (baseOctave === 6) stars = '****';
                return { fingering: `5${stars}`, transposed: doubleNote, wasTransposed: false, shift: 0, exactMatch: true, overblowNote: true };
            }
        }
        
        // Нота недоступна
        return { fingering: '?', transposed: null, wasTransposed: false, shift: 0, exactMatch: false, overblowNote: false };
    }
    
    // Функция для поиска ближайшей доступной ноты
    function findClosestNote(originalNote, targetKuraiKey) {
        const scaleNotes = KURAI_SCALES[targetKuraiKey].notes;
        const allAvailableNotes = [...scaleNotes];
        
        // Добавляем передувы в доступные ноты
        const fifthNote = scaleNotes[5];
        const idxFifth = CHROMATIC.indexOf(fifthNote);
        if (idxFifth !== -1) {
            allAvailableNotes.push(CHROMATIC[(idxFifth + 1) % 12]);
            allAvailableNotes.push(CHROMATIC[(idxFifth + 2) % 12]);
        }
        
        let closestNote = null;
        let minDistance = 100;
        
        for (const availableNote of allAvailableNotes) {
            const originalIdx = CHROMATIC.indexOf(originalNote);
            const availableIdx = CHROMATIC.indexOf(availableNote);
            if (originalIdx !== -1 && availableIdx !== -1) {
                let distance = Math.abs(originalIdx - availableIdx);
                distance = Math.min(distance, 12 - distance);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestNote = availableNote;
                }
            }
        }
        
        return { note: closestNote, distance: minDistance };
    }
    
    // Парсинг текста с сохранением структуры
    function parseNotesWithFormat(text) {
        const lines = text.split(/\r?\n/);
        const parsedLines = [];
        const allNormalized = [];
        for (let line of lines) {
            const segments = [];
            const regex = /[A-Za-zА-Яа-я#b♭♯]+/gu;
            let lastIdx = 0, match;
            while ((match = regex.exec(line)) !== null) {
                const before = line.substring(lastIdx, match.index);
                if (before) segments.push({ type: 'text', content: before });
                const token = match[0].toLowerCase();
                let norm = NOTE_ALIASES[token] || null;
                if (!norm && token.length === 1 && /[abcdefg]/.test(token)) norm = token.toUpperCase();
                segments.push({ type: 'note', original: token, normalized: norm });
                if (norm) allNormalized.push(norm);
                lastIdx = match.index + token.length;
            }
            if (lastIdx < line.length) segments.push({ type: 'text', content: line.substring(lastIdx) });
            parsedLines.push(segments);
        }
        return { parsedLines, allNotes: allNormalized };
    }
    
    function detectKey(notesArray) {
        if (!notesArray.length) return 'C';
        return notesArray[0];
    }
    
    // Получение списка нот для отображения на нотном стане
    function getNoteSequenceFromLine(segments, targetKuraiKey, baseOctave, replacements = {}) {
        const noteSequence = [];
        let noteIndex = 0;
        for (const seg of segments) {
            if (seg.type === 'note' && seg.normalized) {
                const positionKey = `0:${noteIndex}`;
                let result;
                if (replacements[positionKey]) {
                    const rep = replacements[positionKey];
                    result = { fingering: rep.fingering, transposed: rep.transposedNote, wasTransposed: true };
                } else {
                    result = getExactFingering(seg.normalized, targetKuraiKey, baseOctave);
                }
                noteSequence.push({
                    note: result.transposed || seg.normalized,
                    originalNote: seg.normalized,
                    fingering: result.fingering,
                    wasTransposed: result.wasTransposed
                });
                noteIndex++;
            }
        }
        return noteSequence;
    }
    
    // Получение всех проблемных нот с их позициями
    function getAllProblemNotes(text, targetKuraiKey, baseOctave) {
        if (!text.trim()) return [];
        
        const { parsedLines } = parseNotesWithFormat(text);
        const problemNotes = [];
        
        for (let lineIdx = 0; lineIdx < parsedLines.length; lineIdx++) {
            const segments = parsedLines[lineIdx];
            let noteIndex = 0;
            
            for (let colIdx = 0; colIdx < segments.length; colIdx++) {
                const seg = segments[colIdx];
                if (seg.type === 'note' && seg.normalized) {
                    const positionKey = `${lineIdx}:${noteIndex}`;
                    const result = getExactFingering(seg.normalized, targetKuraiKey, baseOctave);
                    
                    if (result.fingering === '?') {
                        problemNotes.push({
                            position: positionKey,
                            originalNote: seg.normalized,
                            line: lineIdx,
                            noteIndex: noteIndex
                        });
                    }
                    noteIndex++;
                }
            }
        }
        
        return problemNotes;
    }
    
    // Автоматическая замена всех проблемных нот (без подтверждения)
    function autoReplaceAllProblems() {
        const text = document.getElementById('notesInput').value;
        const problemNotes = getAllProblemNotes(text, currentKuraiKey, currentOctave);
        
        if (problemNotes.length === 0) {
            return; // Просто ничего не делаем
        }
        
        for (const problem of problemNotes) {
            const closest = findClosestNote(problem.originalNote, currentKuraiKey);
            if (closest.note) {
                const result = getExactFingering(closest.note, currentKuraiKey, currentOctave);
                manualReplacements[problem.position] = {
                    fingering: result.fingering,
                    transposedNote: closest.note,
                    originalNote: problem.originalNote
                };
            }
        }
        
        performRenderWithReplacements();
    }
    
    // Сброс всех замен (без подтверждения)
    function resetAllReplacements() {
        if (Object.keys(manualReplacements).length > 0) {
            manualReplacements = {};
            performRenderWithReplacements();
        }
    }
    
    // Основная обработка мелодии с поддержкой ручных замен
    function processMelodyWithReplacements(text, targetKuraiKey, baseOctave, replacements = {}) {
        if (!text.trim()) return { tab: '—', originalKey: 'C', allNotes: [], missingCount: 0, transpositionCount: 0, transpositionDetails: [], overblowCount: 0, problemNotes: [] };
        
        const { parsedLines, allNotes } = parseNotesWithFormat(text);
        const originalKey = detectKey(allNotes);
        
        const resultLines = [];
        let missingCount = 0;
        let totalNotes = 0;
        let transpositionCount = 0;
        let overblowCount = 0;
        const transpositionDetails = [];
        const problemNotes = [];
        
        for (let lineIdx = 0; lineIdx < parsedLines.length; lineIdx++) {
            const segments = parsedLines[lineIdx];
            let lineRes = '';
            let noteIndexInLine = 0;
            
            for (let colIdx = 0; colIdx < segments.length; colIdx++) {
                const seg = segments[colIdx];
                if (seg.type === 'text') {
                    lineRes += seg.content;
                } else if (seg.type === 'note' && seg.normalized) {
                    totalNotes++;
                    const positionKey = `${lineIdx}:${noteIndexInLine}`;
                    
                    let result;
                    if (replacements[positionKey]) {
                        const replacement = replacements[positionKey];
                        result = { 
                            fingering: replacement.fingering, 
                            transposed: replacement.transposedNote,
                            wasTransposed: true,
                            shift: 0,
                            overblowNote: replacement.fingering.includes('*')
                        };
                        transpositionCount++;
                        lineRes += result.fingering;
                    } else {
                        result = getExactFingering(seg.normalized, targetKuraiKey, baseOctave);
                        if (result.fingering === '?') {
                            missingCount++;
                            problemNotes.push({
                                line: lineIdx,
                                col: colIdx,
                                noteIndex: noteIndexInLine,
                                position: positionKey,
                                originalNote: seg.normalized
                            });
                            lineRes += '?';
                            noteIndexInLine++;
                            continue;
                        }
                        lineRes += result.fingering;
                        if (result.wasTransposed) {
                            transpositionCount++;
                            transpositionDetails.push(`${seg.normalized} → ${result.transposed} (сдвиг ${result.shift > 0 ? '+' : ''}${result.shift})`);
                        }
                        if (result.overblowNote) overblowCount++;
                    }
                    noteIndexInLine++;
                }
            }
            resultLines.push(lineRes);
        }
        
        return {
            tab: resultLines.join('\n'),
            originalKey: originalKey,
            allNotes: allNotes,
            missingCount: missingCount,
            totalNotes: totalNotes,
            transpositionCount: transpositionCount,
            transpositionDetails: transpositionDetails,
            overblowCount: overblowCount,
            problemNotes: problemNotes
        };
    }
    
    function findMatchingKuraisForOriginal(notes) {
        const uniqueNotes = [...new Set(notes)];
        const matches = [];
        for (let [key, scale] of Object.entries(KURAI_SCALES)) {
            let allPresent = true;
            for (let note of uniqueNotes) {
                if (!scale.notes.includes(note)) {
                    allPresent = false;
                    break;
                }
            }
            if (allPresent) matches.push({ key, name: scale.name });
        }
        return matches;
    }
    
    function updateMappingGrid(kuraiKey, octave) {
        const grid = document.getElementById('mappingGrid');
        const scale = KURAI_SCALES[kuraiKey];
        if (!scale) { grid.innerHTML = '<div>Нет данных</div>'; return; }
        const noteDisplay = {
            'C':'C/До','C#':'C#/До#','D':'D/Ре','D#':'D#/Ре#','E':'E/Ми',
            'F':'F/Фа','F#':'F#/Фа#','G':'G/Соль','G#':'G#/Соль#','A':'A/Ля','A#':'A#/Ля#','B':'B/Си'
        };
        const overInfo = getSeventhNoteAndOverblow(scale.notes);
        const items = [];
        for (let i = 0; i < scale.notes.length; i++) {
            const note = scale.notes[i];
            let stars = (octave === 5) ? '*' : (octave === 6 ? '**' : '');
            items.push(`<div class="mapping-item"><span>${i}${stars}</span> → ${noteDisplay[note] || note}</div>`);
        }
        if (overInfo) {
            let star = (octave === 5) ? '**' : (octave === 6 ? '***' : '*');
            let doubleStar = (octave === 5) ? '***' : (octave === 6 ? '****' : '**');
            items.push(`<div class="mapping-item"><span>5${star}</span> → ${noteDisplay[overInfo.seventh] || overInfo.seventh} (передув)</div>`);
            items.push(`<div class="mapping-item"><span>5${doubleStar}</span> → ${noteDisplay[overInfo.double] || overInfo.double} (двойной)</div>`);
        }
        grid.innerHTML = items.join('');
    }
    
    function updateSuggestions(text, currentKey) {
        const { allNotes } = parseNotesWithFormat(text);
        const container = document.getElementById('suggestContainer');
        if (allNotes.length === 0) {
            container.innerHTML = '<span>⚙️ Введите ноты</span>';
            return;
        }
        const matches = findMatchingKuraisForOriginal(allNotes);
        if (matches.length === 0) {
            container.innerHTML = '<span>⚠️ Нет курая, содержащего все ноты. Можно использовать транспонирование или передувы.</span>';
            return;
        }
        container.innerHTML = '';
        matches.forEach(m => {
            const btn = document.createElement('div');
            btn.className = 'kurai-badge' + (currentKey === m.key ? ' active' : '');
            btn.innerText = `${m.name} (${m.key})`;
            btn.dataset.key = m.key;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.kurai-badge').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('keySelector').value = m.key;
                currentKuraiKey = m.key;
                manualReplacements = {};
                performRenderWithReplacements();
            });
            container.appendChild(btn);
        });
    }
    
    // --------------------------------------------------------------
    // 2. Состояние и рендер (основной)
    // --------------------------------------------------------------
    let currentKuraiKey = 'C';
    let currentOctave = 4;
    let manualReplacements = {};
    
    // Функция для вызова рендеринга нотного стана (будет переопределена из второго файла)
    let renderNotationCallback = null;
    
    function setRenderNotationCallback(callback) {
        renderNotationCallback = callback;
    }
    
    // Функция обновления состояния кнопки actionBtn
    function updateActionButton() {
        const text = document.getElementById('notesInput').value;
        const hasProblemNotes = getAllProblemNotes(text, currentKuraiKey, currentOctave).length > 0;
        const hasReplacements = Object.keys(manualReplacements).length > 0;
        
        const actionBtn = document.getElementById('actionBtn');
        if (actionBtn) {
            // Если есть замены - показываем кнопку "Вернуть"
            if (hasReplacements) {
                actionBtn.style.display = 'inline-block';
                actionBtn.innerHTML = `🔄 Вернуть (${Object.keys(manualReplacements).length})`;
                actionBtn.title = 'Сбросить все замены';
                actionBtn.disabled = false;
            } 
            // Если нет замен, но есть проблемные ноты - показываем "Заменить все ?"
            else if (hasProblemNotes) {
                actionBtn.style.display = 'inline-block';
                const problemCount = getAllProblemNotes(text, currentKuraiKey, currentOctave).length;
                actionBtn.innerHTML = `🔧 Заменить все ? (${problemCount})`;
                actionBtn.title = 'Автоматически заменить все недоступные ноты';
                actionBtn.disabled = false;
            } 
            // Если все ноты доступны и нет замен - скрываем кнопку
            else {
                actionBtn.style.display = 'none';
            }
        }
    }
    
    function performRenderWithReplacements() {
        const text = document.getElementById('notesInput').value;
        const result = processMelodyWithReplacements(text, currentKuraiKey, currentOctave, manualReplacements);
        
        // Отображаем табулатуру с подсветкой проблемных мест
        let tabHtml = result.tab;
        if (result.missingCount > 0) {
            tabHtml = tabHtml.replace(/\?/g, '<span style="color: #c0392b; background: #ffe0e0; display: inline-block; min-width: 20px; text-align: center; border-radius: 4px;">?</span>');
        }
        document.getElementById('tabResult').innerHTML = tabHtml;
        document.getElementById('detectedKey').innerText = result.originalKey;
        updateMappingGrid(currentKuraiKey, currentOctave);
        updateSuggestions(text, currentKuraiKey);
        document.getElementById('keySelector').value = currentKuraiKey;
        
        let infoText = '';
        const scaleName = KURAI_SCALES[currentKuraiKey]?.name || currentKuraiKey;
        
        if (result.missingCount > 0) {
            infoText = `⚠️ ${result.missingCount} нот недоступны в строе ${scaleName}. Нажмите "Заменить все ?" для автоподбора.`;
        } else if (result.transpositionCount === 0 && result.overblowCount === 0) {
            infoText = `✅ Все ноты есть в звукоряде ${scaleName}. Передувы не нужны.`;
        } else if (result.overblowCount > 0) {
            infoText = `🎵 Использовано передуваний: ${result.overblowCount}. Заменено: ${result.transpositionCount}.`;
        } else if (result.transpositionCount > 0) {
            infoText = `🎵 Заменено ${result.transpositionCount} из ${result.totalNotes} нот.`;
        } else {
            infoText = 'Готово';
        }
        
        document.getElementById('transposeInfo').innerHTML = infoText;
        
        // Показываем детали транспонирования если есть
        if (result.transpositionDetails.length > 0 && result.transpositionCount > 0) {
            const detailsHtml = `<details style="margin-top: 8px; font-size: 0.75rem; color: #8b6946;"><summary>Детали замен (${result.transpositionCount})</summary>${result.transpositionDetails.slice(0, 10).join('<br>')}${result.transpositionDetails.length > 10 ? '<br>...' : ''}</details>`;
            document.getElementById('transposeInfo').innerHTML += detailsHtml;
        }
        
        // Обновляем состояние кнопки actionBtn
        updateActionButton();
    }
    
    // Экспорт функций для использования из второго файла
    window.KuraiCore = {
        getCurrentKuraiKey: () => currentKuraiKey,
        getCurrentOctave: () => currentOctave,
        getManualReplacements: () => manualReplacements,
        getExactFingering: getExactFingering,
        parseNotesWithFormat: parseNotesWithFormat,
        getNoteSequenceFromLine: getNoteSequenceFromLine,
        performRenderWithReplacements: performRenderWithReplacements,
        setRenderNotationCallback: setRenderNotationCallback
    };
    
    // --------------------------------------------------------------
    // 3. Инициализация DOM-событий
    // --------------------------------------------------------------
    function initEventHandlers() {
        document.getElementById('convertBtn').addEventListener('click', () => {
            performRenderWithReplacements();
        });
        
        document.getElementById('applyKuraiBtn').addEventListener('click', () => {
            currentKuraiKey = document.getElementById('keySelector').value;
            manualReplacements = {};
            performRenderWithReplacements();
        });
        
        document.getElementById('octaveDown').addEventListener('click', () => { 
            if (currentOctave > 3) { 
                currentOctave--; 
                document.getElementById('currentOctave').innerText = currentOctave; 
                manualReplacements = {};
                performRenderWithReplacements(); 
            } 
        });
        
        document.getElementById('octaveUp').addEventListener('click', () => { 
            if (currentOctave < 6) { 
                currentOctave++; 
                document.getElementById('currentOctave').innerText = currentOctave; 
                manualReplacements = {};
                performRenderWithReplacements(); 
            } 
        });
        
        document.getElementById('copyBtn').addEventListener('click', async () => {
            const tabDiv = document.getElementById('tabResult');
            const txt = tabDiv.innerText || tabDiv.textContent;
            if (!txt || txt === '—') return alert('Нет данных');
            await navigator.clipboard.writeText(txt);
            const btn = document.getElementById('copyBtn');
            btn.innerHTML = '📄 Скопировано!';
            setTimeout(() => btn.innerHTML = '📋 Копировать', 1500);
        });
        
        document.getElementById('showNotationBtn').addEventListener('click', () => {
            if (renderNotationCallback) {
                renderNotationCallback();
            } else {
                alert('Модуль нотного стана не загружен');
            }
        });
        
        document.getElementById('closeNotationBtn').addEventListener('click', () => {
            document.getElementById('notationContainer').style.display = 'none';
        });
        
        // Универсальная кнопка: либо замена, либо возврат
        document.getElementById('actionBtn').addEventListener('click', () => {
            const text = document.getElementById('notesInput').value;
            const hasProblemNotes = getAllProblemNotes(text, currentKuraiKey, currentOctave).length > 0;
            const hasReplacements = Object.keys(manualReplacements).length > 0;
            
            if (hasReplacements) {
                resetAllReplacements();
            } else if (hasProblemNotes) {
                autoReplaceAllProblems();
            }
        });
    }
    
    // Пример мелодии
    document.getElementById('notesInput').value = `D-D D C`;
    
    currentKuraiKey = 'C';
    currentOctave = 4;
    manualReplacements = {};
    
    initEventHandlers();
    performRenderWithReplacements();
})();