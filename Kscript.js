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
    
    function getOptimalFingeringWithOverblow(originalNote, targetKuraiKey, baseOctave) {
        const scaleNotes = KURAI_SCALES[targetKuraiKey].notes;
        if (!scaleNotes.length) return { fingering: '?', transposed: null, wasTransposed: false, shift: 0 };
        
        // Прямое попадание в основной звукоряд
        if (scaleNotes.includes(originalNote)) {
            const index = scaleNotes.indexOf(originalNote);
            let stars = '';
            if (baseOctave === 5) stars = '*';
            else if (baseOctave === 6) stars = '**';
            return { fingering: index.toString() + stars, transposed: originalNote, wasTransposed: false, shift: 0, overblowNote: false };
        }
        
        // Передувы на 5-й позиции (септима и децима)
        const fifthNote = scaleNotes[5];
        const idxFifth = CHROMATIC.indexOf(fifthNote);
        if (idxFifth !== -1) {
            const seventhNote = CHROMATIC[(idxFifth + 1) % 12];
            if (originalNote === seventhNote) {
                let stars = '*';
                if (baseOctave === 5) stars = '**';
                else if (baseOctave === 6) stars = '***';
                return { fingering: `5${stars}`, transposed: seventhNote, wasTransposed: false, shift: 0, overblowNote: true };
            }
            const doubleNote = CHROMATIC[(idxFifth + 2) % 12];
            if (originalNote === doubleNote) {
                let stars = '**';
                if (baseOctave === 5) stars = '***';
                else if (baseOctave === 6) stars = '****';
                return { fingering: `5${stars}`, transposed: doubleNote, wasTransposed: false, shift: 0, overblowNote: true };
            }
        }
        
        // Транспонирование (поиск ближайшей замены в пределах ±5 полутонов)
        for (let shift of [-1, 1, -2, 2, -3, 3, -4, 4, -5, 5]) {
            const transposed = transposeNote(originalNote, shift);
            if (scaleNotes.includes(transposed)) {
                const index = scaleNotes.indexOf(transposed);
                let stars = '';
                if (baseOctave === 5) stars = '*';
                else if (baseOctave === 6) stars = '**';
                return { fingering: index.toString() + stars, transposed: transposed, wasTransposed: true, shift: shift, overblowNote: false };
            }
        }
        
        return { fingering: '?', transposed: null, wasTransposed: false, shift: 0 };
    }
    
    // Парсинг текста с сохранением структуры (ноты + остальной текст)
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
    function getNoteSequence(text, targetKuraiKey, baseOctave) {
        if (!text.trim()) return [];
        const { parsedLines, allNotes } = parseNotesWithFormat(text);
        const noteSequence = [];
        
        for (const segments of parsedLines) {
            for (const seg of segments) {
                if (seg.type === 'note' && seg.normalized) {
                    const result = getOptimalFingeringWithOverblow(seg.normalized, targetKuraiKey, baseOctave);
                    noteSequence.push({
                        note: result.transposed || seg.normalized,
                        originalNote: seg.normalized,
                        fingering: result.fingering,
                        wasTransposed: result.wasTransposed
                    });
                }
            }
        }
        return noteSequence;
    }
    
    // Основная обработка мелодии
    function processMelody(text, targetKuraiKey, baseOctave) {
        if (!text.trim()) return { tab: '—', originalKey: 'C', allNotes: [], missingCount: 0, transpositionCount: 0, transpositionDetails: [], overblowCount: 0 };
        
        const { parsedLines, allNotes } = parseNotesWithFormat(text);
        const originalKey = detectKey(allNotes);
        
        const resultLines = [];
        let missingCount = 0;
        let totalNotes = 0;
        let transpositionCount = 0;
        let overblowCount = 0;
        const transpositionDetails = [];
        
        for (const segments of parsedLines) {
            let lineRes = '';
            for (const seg of segments) {
                if (seg.type === 'text') {
                    lineRes += seg.content;
                } else if (seg.type === 'note' && seg.normalized) {
                    totalNotes++;
                    const result = getOptimalFingeringWithOverblow(seg.normalized, targetKuraiKey, baseOctave);
                    if (result.fingering === '?') {
                        missingCount++;
                        lineRes += '?';
                    } else {
                        lineRes += result.fingering;
                        if (result.wasTransposed) {
                            transpositionCount++;
                            transpositionDetails.push(`${seg.normalized} → ${result.transposed} (сдвиг ${result.shift > 0 ? '+' : ''}${result.shift})`);
                        }
                        if (result.overblowNote) overblowCount++;
                    }
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
            overblowCount: overblowCount
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
                performRender();
            });
            container.appendChild(btn);
        });
    }
    
    // --------------------------------------------------------------
    // Функция для отображения нотного стана с использованием VexFlow EasyScore
    // --------------------------------------------------------------
  function renderNotation() {
        const text = document.getElementById('notesInput').value;
        const noteSequence = getNoteSequence(text, currentKuraiKey, currentOctave);
        
        if (noteSequence.length === 0) {
            alert('Нет нот для отображения. Пожалуйста, введите ноты.');
            return;
        }
        
        // Показываем контейнер
        const container = document.getElementById('notationContainer');
        container.style.display = 'block';
        
        // Очищаем предыдущие рендеры
        const staffCanvas = document.getElementById('staffCanvas');
        const tabStaffCanvas = document.getElementById('tabStaffCanvas');
        staffCanvas.innerHTML = '';
        tabStaffCanvas.innerHTML = '';
        
        try {
            const VF = Vex.Flow;
            
            const width = Math.min(800, window.innerWidth - 100);
            const height = 200;
            
            // --------------------------------------------------------------
            // Верхний стан: обычные ноты с использованием низкоуровневого API
            // --------------------------------------------------------------
            const renderer = new VF.Renderer(staffCanvas, VF.Renderer.Backends.SVG);
            renderer.resize(width, height);
            const context = renderer.getContext();
            context.setFont('Arial', 10);
            
            // Создаем нотный стан
            const stave = new VF.Stave(10, 20, width - 20);
            stave.addClef('treble').addTimeSignature('4/4');
            stave.setContext(context).draw();
            
            // Создаем ноты
            const staveNotes = [];
            for (let i = 0; i < noteSequence.length; i++) {
                const noteData = noteSequence[i];
                let noteName = noteData.note;
                
                // Преобразуем ноту в формат с октавой
                let noteWithOctave;
                switch(noteName) {
                    case 'C': noteWithOctave = 'c/4'; break;
                    case 'C#': noteWithOctave = 'c#/4'; break;
                    case 'D': noteWithOctave = 'd/4'; break;
                    case 'D#': noteWithOctave = 'd#/4'; break;
                    case 'E': noteWithOctave = 'e/4'; break;
                    case 'F': noteWithOctave = 'f/4'; break;
                    case 'F#': noteWithOctave = 'f#/4'; break;
                    case 'G': noteWithOctave = 'g/4'; break;
                    case 'G#': noteWithOctave = 'g#/4'; break;
                    case 'A': noteWithOctave = 'a/4'; break;
                    case 'A#': noteWithOctave = 'a#/4'; break;
                    case 'B': noteWithOctave = 'b/4'; break;
                    default: noteWithOctave = 'c/4';
                }
                
                const staveNote = new VF.StaveNote({
                    keys: [noteWithOctave],
                    duration: 'q',
                    auto_stem: true
                });
                
                // Добавляем диез если нужно
                if (noteName.includes('#')) {
                    staveNote.addAccidental(0, new VF.Accidental('#'));
                }
                
                staveNotes.push(staveNote);
            }
            
            // Разбиваем ноты на группы по 4 (такты) и создаем несколько голосов
            const voices = [];
            for (let i = 0; i < staveNotes.length; i += 4) {
                const beatCount = Math.min(4, staveNotes.length - i);
                const voice = new VF.Voice({ num_beats: beatCount, beat_value: 4 });
                voice.addTickables(staveNotes.slice(i, i + beatCount));
                voices.push(voice);
            }
            
            // Форматируем и рисуем каждый голос
            let currentX = 10;
            for (let i = 0; i < voices.length; i++) {
                const voice = voices[i];
                const notesCount = voice.getTickables().length;
                const staveWidth = Math.min(200, (width - 20) / voices.length);
                
                const formatter = new VF.Formatter();
                formatter.joinVoices([voice]).formatToStave([voice], stave);
                voice.draw(context, stave);
            }
            
            // --------------------------------------------------------------
            // Нижний стан: табулатура для курая
            // --------------------------------------------------------------
            const tabRenderer = new VF.Renderer(tabStaffCanvas, VF.Renderer.Backends.SVG);
            tabRenderer.resize(width, 150);
            const tabContext = tabRenderer.getContext();
            tabContext.setFont('Arial', 12);
            
            // Создаем табулатурный стан
            const tabStave = new VF.TabStave(10, 10, width - 20);
            tabStave.addTabGlyph();
            tabStave.setContext(tabContext).draw();
            
            // Создаем табулатурные ноты
            const tabNotes = [];
            for (let i = 0; i < noteSequence.length; i++) {
                const noteData = noteSequence[i];
                let fingeringValue = noteData.fingering.replace(/\*/g, '');
                if (fingeringValue === '?') fingeringValue = '0';
                const fretNum = parseInt(fingeringValue) || 0;
                
                const tabNote = new VF.TabNote({
                    positions: [{ str: 1, fret: fretNum }],
                    duration: 'q'
                });
                
                tabNotes.push(tabNote);
            }
            
            // Разбиваем табулатурные ноты на группы по 4
            const tabVoices = [];
            for (let i = 0; i < tabNotes.length; i += 4) {
                const beatCount = Math.min(4, tabNotes.length - i);
                const tabVoice = new VF.Voice({ num_beats: beatCount, beat_value: 4 });
                tabVoice.addTickables(tabNotes.slice(i, i + beatCount));
                tabVoices.push(tabVoice);
            }
            
            // Форматируем и рисуем табулатуру
            for (let i = 0; i < tabVoices.length; i++) {
                const tabVoice = tabVoices[i];
                const formatter = new VF.Formatter();
                formatter.joinVoices([tabVoice]).formatToStave([tabVoice], tabStave);
                tabVoice.draw(tabContext, tabStave);
            }
            
            // Добавляем подписи под нотами
            setTimeout(() => {
                addLabelsUnderNotes(staffCanvas, noteSequence);
            }, 200);
            
        } catch (error) {
            console.error('Ошибка при рендеринге нот:', error);
            const staffCanvas = document.getElementById('staffCanvas');
            staffCanvas.innerHTML = `<div class="error-message">Ошибка при создании нотного стана: ${error.message}<br>Пожалуйста, проверьте формат нот.</div>`;
        }
    }
    
    // Функция для добавления подписей (аппликатуры) под нотами
    function addLabelsUnderNotes(container, noteSequence) {
        const svg = container.querySelector('svg');
        if (!svg) return;
        
        // Удаляем старый контейнер с подписями
        const oldContainer = container.querySelector('.labels-container');
        if (oldContainer) oldContainer.remove();
        
        // Создаем контейнер для подписей
        const labelsContainer = document.createElement('div');
        labelsContainer.className = 'labels-container';
        labelsContainer.style.position = 'relative';
        labelsContainer.style.marginTop = '10px';
        labelsContainer.style.textAlign = 'center';
        labelsContainer.style.fontFamily = 'monospace';
        labelsContainer.style.fontSize = '14px';
        labelsContainer.style.fontWeight = 'bold';
        container.appendChild(labelsContainer);
        
        // Находим все нотные головки
        const noteHeads = svg.querySelectorAll('.vf-notehead');
        
        for (let i = 0; i < noteSequence.length && i < noteHeads.length; i++) {
            const noteData = noteSequence[i];
            const noteElement = noteHeads[i];
            
            if (noteElement && noteElement.getBoundingClientRect) {
                const rect = noteElement.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                const label = document.createElement('span');
                label.textContent = noteData.fingering;
                label.style.position = 'absolute';
                label.style.left = (rect.left - containerRect.left + rect.width / 2 - 15) + 'px';
                label.style.top = '65px';
                label.style.width = '30px';
                label.style.textAlign = 'center';
                label.style.color = '#b45f2b';
                label.style.backgroundColor = '#fae6cd';
                label.style.borderRadius = '20px';
                label.style.padding = '4px 6px';
                label.style.fontSize = '12px';
                label.style.fontWeight = 'bold';
                label.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
                label.style.border = '1px solid #c69954';
                label.style.zIndex = '100';
                
                labelsContainer.appendChild(label);
            }
        }
    }
    
    // --------------------------------------------------------------
    // 2. Состояние и рендер
    // --------------------------------------------------------------
    let currentKuraiKey = 'C';
    let currentOctave = 4;
    
    function performRender() {
        const text = document.getElementById('notesInput').value;
        const result = processMelody(text, currentKuraiKey, currentOctave);
        document.getElementById('tabResult').innerText = result.tab;
        document.getElementById('detectedKey').innerText = result.originalKey;
        updateMappingGrid(currentKuraiKey, currentOctave);
        updateSuggestions(text, currentKuraiKey);
        document.getElementById('keySelector').value = currentKuraiKey;
        
        let infoText = '';
        const scaleName = KURAI_SCALES[currentKuraiKey]?.name || currentKuraiKey;
        if (result.transpositionCount === 0 && result.missingCount === 0 && result.overblowCount === 0)
            infoText = `✅ Все ноты есть в звукоряде ${scaleName}. Передувы не нужны.`;
        else if (result.overblowCount > 0)
            infoText = `🎵 Использовано передуваний: ${result.overblowCount}. Транспонировано: ${result.transpositionCount}.`;
        else if (result.transpositionCount > 0)
            infoText = `🎵 Транспонировано ${result.transpositionCount} из ${result.totalNotes} нот.`;
        if (result.missingCount > 0) infoText += ` ⚠️ ${result.missingCount} нот не найдены (?)`;
        document.getElementById('transposeInfo').innerHTML = infoText || 'Готово';
    }
    
    // --------------------------------------------------------------
    // 3. Инициализация DOM-событий и пример по умолчанию
    // --------------------------------------------------------------
    document.getElementById('convertBtn').addEventListener('click', performRender);
    document.getElementById('applyKuraiBtn').addEventListener('click', () => {
        currentKuraiKey = document.getElementById('keySelector').value;
        performRender();
    });
    
    document.getElementById('octaveDown').addEventListener('click', () => { 
        if (currentOctave > 3) { 
            currentOctave--; 
            document.getElementById('currentOctave').innerText = currentOctave; 
            performRender(); 
        } 
    });
    document.getElementById('octaveUp').addEventListener('click', () => { 
        if (currentOctave < 6) { 
            currentOctave++; 
            document.getElementById('currentOctave').innerText = currentOctave; 
            performRender(); 
        } 
    });
    document.getElementById('copyBtn').addEventListener('click', async () => {
        const txt = document.getElementById('tabResult').innerText;
        if (!txt || txt === '—') return alert('Нет данных');
        await navigator.clipboard.writeText(txt);
        const btn = document.getElementById('copyBtn');
        btn.innerHTML = '📄 Скопировано!';
        setTimeout(() => btn.innerHTML = '📋 Копировать', 1500);
    });
    
    // Новая кнопка для отображения нотного стана
    document.getElementById('showNotationBtn').addEventListener('click', () => {
        renderNotation();
    });
    
    // Кнопка закрытия нотного стана
    document.getElementById('closeNotationBtn').addEventListener('click', () => {
        document.getElementById('notationContainer').style.display = 'none';
    });
    
    // Пример мелодии (курайная тема)
    document.getElementById('notesInput').value = `C D C F E F G F E D C
C D C F E F G F E D A

E E F C 
C C D C B E C
E E F C 
C C D C B F E
E E F C 
C C D C B E C
E E F C 
C C D C B E C`;
    
    currentKuraiKey = 'C';
    performRender();
})();