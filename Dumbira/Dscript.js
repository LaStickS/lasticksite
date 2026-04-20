// Нотный парсер и MIDI маппинг
const NOTE_TO_MIDI = {
    'c': 0, 'c#': 1, 'db': 1, 'd': 2, 'd#': 3, 'eb': 3, 'e': 4, 'f': 5,
    'f#': 6, 'gb': 6, 'g': 7, 'g#': 8, 'ab': 8, 'a': 9, 'a#': 10, 'bb': 10, 'b': 11
};

// Полное отображение русских названий нот в латиницу (без октав)
const RUSSIAN_BASE = {
    'до': 'c', 'ре': 'd', 'ми': 'e', 'фа': 'f', 'соль': 'g', 'ля': 'a', 'си': 'b'
};

// Функция для нормализации строки
function normalizeNoteString(str) {
    return str.trim().toLowerCase().replace(/\s+/g, '');
}

// Основная функция парсинга ноты - поддерживает ВСЕ форматы
function parseNote(noteStr) {
    const original = noteStr;
    let normalized = normalizeNoteString(noteStr);
    
    // ========== 1. Прямое соответствие в словаре русских нот со знаками ==========
    const russianWithAccidentals = {
        // Диезы
        'до#': 'c#', 'до-диез': 'c#', 'додиез': 'c#',
        'ре#': 'd#', 'ре-диез': 'd#', 'редиез': 'd#',
        'ми#': 'e#', 'ми-диез': 'e#', 'мидиез': 'e#',
        'фа#': 'f#', 'фа-диез': 'f#', 'фадиез': 'f#',
        'соль#': 'g#', 'соль-диез': 'g#', 'сольдиез': 'g#',
        'ля#': 'a#', 'ля-диез': 'a#', 'лядиез': 'a#',
        'си#': 'b#', 'си-диез': 'b#', 'сидиез': 'b#',
        // Бемоли
        'доб': 'db', 'до-бемоль': 'db', 'добемоль': 'db',
        'реб': 'eb', 'ре-бемоль': 'eb', 'ребемоль': 'eb',
        'миб': 'eb', 'ми-бемоль': 'eb', 'мибемоль': 'eb',
        'фаб': 'gb', 'фа-бемоль': 'gb', 'фабемоль': 'gb',
        'сольб': 'gb', 'соль-бемоль': 'gb', 'сольбемоль': 'gb',
        'ляб': 'ab', 'ля-бемоль': 'ab', 'лябемоль': 'ab',
        'сиб': 'bb', 'си-бемоль': 'bb', 'сибемоль': 'bb'
    };
    
    // Проверяем прямое соответствие (без октавы)
    if (russianWithAccidentals[normalized]) {
        let midi = NOTE_TO_MIDI[russianWithAccidentals[normalized]] + (4 + 1) * 12;
        return midi;
    }
    
    // ========== 2. Русская нота с октавой: "Ляb4", "Соль#2", "Ре-бемоль3" ==========
    // Паттерн: (русская нота)(возможные знаки #, b, -диез, -бемоль)(возможная октава)
    const russianPattern = /^(до|ре|ми|фа|соль|ля|си)([#b]|[-\u2013]?(?:диез|бемоль))?(\d*)$/i;
    const russianMatch = normalized.match(russianPattern);
    
    if (russianMatch) {
        const [, baseNote, accidentalMark, octaveStr] = russianMatch;
        
        // Определяем знак альтерации
        let accidental = '';
        if (accidentalMark) {
            if (accidentalMark === '#' || accidentalMark.includes('диез')) {
                accidental = '#';
            } else if (accidentalMark === 'b' || accidentalMark.includes('бемоль')) {
                accidental = 'b';
            }
        }
        
        // Получаем латинскую ноту
        const latinBase = RUSSIAN_BASE[baseNote];
        if (latinBase) {
            let fullNote = latinBase + accidental;
            
            // Проверяем существование ноты
            if (NOTE_TO_MIDI[fullNote] !== undefined) {
                let octave = 4; // октава по умолчанию
                if (octaveStr && octaveStr.length > 0) {
                    octave = parseInt(octaveStr, 10);
                }
                let midi = NOTE_TO_MIDI[fullNote] + (octave + 1) * 12;
                return midi;
            }
        }
    }
    
    // ========== 3. Английская нота (форматы: Ab, Ab4, A#4, Gb, Bb3) ==========
    const englishPattern = /^([a-g])([#b]?)(\d*)$/i;
    const englishMatch = normalized.match(englishPattern);
    
    if (englishMatch) {
        const [, noteLetter, accidental, octaveStr] = englishMatch;
        let fullNote = noteLetter.toLowerCase() + (accidental || '');
        
        if (NOTE_TO_MIDI[fullNote] !== undefined) {
            let octave = 4; // по умолчанию 4 для заглавных
            if (octaveStr && octaveStr.length > 0) {
                octave = parseInt(octaveStr, 10);
            } else {
                // Если октава не указана, определяем по регистру в оригинале
                if (noteStr.match(/^[A-G]/)) {
                    octave = 4;
                } else {
                    octave = 3;
                }
            }
            let midi = NOTE_TO_MIDI[fullNote] + (octave + 1) * 12;
            return midi;
        }
    }
    
    // ========== 4. Русская нота с английским знаком: "Ляb", "Соль#", "Реb4" ==========
    const mixedPattern = /^(до|ре|ми|фа|соль|ля|си)([#b])(\d*)$/i;
    const mixedMatch = normalized.match(mixedPattern);
    
    if (mixedMatch) {
        const [, baseNote, accidental, octaveStr] = mixedMatch;
        const latinBase = RUSSIAN_BASE[baseNote];
        if (latinBase) {
            let fullNote = latinBase + accidental;
            if (NOTE_TO_MIDI[fullNote] !== undefined) {
                let octave = 4;
                if (octaveStr && octaveStr.length > 0) {
                    octave = parseInt(octaveStr, 10);
                }
                let midi = NOTE_TO_MIDI[fullNote] + (octave + 1) * 12;
                return midi;
            }
        }
    }
    
    // ========== 5. Простая русская нота без знака: "до", "ре", "Соль" ==========
    if (RUSSIAN_BASE[normalized]) {
        let midi = NOTE_TO_MIDI[RUSSIAN_BASE[normalized]] + (4 + 1) * 12;
        return midi;
    }
    
    // ========== 6. Русская нота с октавой без знака: "Соль4", "ля3" ==========
    const simpleRussianPattern = /^(до|ре|ми|фа|соль|ля|си)(\d+)$/i;
    const simpleRussianMatch = normalized.match(simpleRussianPattern);
    
    if (simpleRussianMatch) {
        const [, baseNote, octaveStr] = simpleRussianMatch;
        const latinBase = RUSSIAN_BASE[baseNote];
        if (latinBase && NOTE_TO_MIDI[latinBase] !== undefined) {
            let octave = parseInt(octaveStr, 10);
            let midi = NOTE_TO_MIDI[latinBase] + (octave + 1) * 12;
            return midi;
        }
    }
    
    // ========== 7. Английская нота без знака: "A", "B", "C4" ==========
    const simpleEnglishPattern = /^([a-g])(\d*)$/i;
    const simpleEnglishMatch = normalized.match(simpleEnglishPattern);
    
    if (simpleEnglishMatch) {
        const [, noteLetter, octaveStr] = simpleEnglishMatch;
        if (NOTE_TO_MIDI[noteLetter] !== undefined) {
            let octave = 4;
            if (octaveStr && octaveStr.length > 0) {
                octave = parseInt(octaveStr, 10);
            } else {
                if (noteStr.match(/^[A-G]/)) {
                    octave = 4;
                } else {
                    octave = 3;
                }
            }
            let midi = NOTE_TO_MIDI[noteLetter] + (octave + 1) * 12;
            return midi;
        }
    }
    
    return null;
}

function midiToNote(midi) {
    const pitch = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    
    const pitchNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return pitchNames[pitch] + octave;
}

function parseMelody(input) {
    const tokens = input.split(/[\s,;\n]+/).filter(t => t.length > 0);
    const results = [];
    const errors = [];
    
    for (const token of tokens) {
        const midi = parseNote(token);
        if (midi !== null) {
            results.push({ token, midi });
        } else {
            errors.push(token);
        }
    }
    
    return { notes: results, errors };
}

class DumbiraTabGenerator {
    constructor(tuning) {
        this.tuning = tuning;
        this.stringCount = 3;
        this.stringDisplayNames = ['верхняя', 'средняя', 'нижняя'];
    }
    
    findBestString(midiNote, avoidString = -1) {
        let bestString = -1;
        let bestFret = Infinity;
        
        for (let s = 0; s < this.stringCount; s++) {
            if (s === avoidString) continue;
            const openMidi = this.tuning[s];
            const fret = midiNote - openMidi;
            
            if (fret >= 0 && fret <= 24 && fret < bestFret) {
                bestFret = fret;
                bestString = s;
            }
        }
        
        if (bestString === -1) return null;
        return { string: bestString, fret: bestFret };
    }
    
    findAllPossibleStrings(midiNote) {
        const possibilities = [];
        for (let s = 0; s < this.stringCount; s++) {
            const openMidi = this.tuning[s];
            const fret = midiNote - openMidi;
            if (fret >= 0 && fret <= 24) {
                possibilities.push({ string: s, fret: fret });
            }
        }
        return possibilities;
    }
    
    generateTab(notesArray) {
        const tabData = [];
        
        for (const note of notesArray) {
            const assignment = this.findBestString(note.midi);
            if (assignment) {
                tabData.push({
                    note: note.token,
                    midi: note.midi,
                    string: assignment.string,
                    fret: assignment.fret,
                    reachable: true
                });
            } else {
                tabData.push({
                    note: note.token,
                    midi: note.midi,
                    string: null,
                    fret: null,
                    reachable: false
                });
            }
        }
        
        return { tabData };
    }
    
    generateAlternativeTab(notesArray) {
        const tabData = [];
        let previousString = -1;
        
        for (const note of notesArray) {
            const possibilities = this.findAllPossibleStrings(note.midi);
            
            if (possibilities.length === 0) {
                tabData.push({
                    note: note.token,
                    midi: note.midi,
                    string: null,
                    fret: null,
                    reachable: false
                });
                previousString = -1;
                continue;
            }
            
            let bestOption = null;
            
            if (previousString !== -1) {
                const differentStringOptions = possibilities.filter(p => p.string !== previousString);
                if (differentStringOptions.length > 0) {
                    bestOption = differentStringOptions.reduce((a, b) => (a.fret < b.fret ? a : b));
                }
            }
            
            if (!bestOption && possibilities.length > 0) {
                bestOption = possibilities.reduce((a, b) => (a.fret < b.fret ? a : b));
            }
            
            if (bestOption) {
                tabData.push({
                    note: note.token,
                    midi: note.midi,
                    string: bestOption.string,
                    fret: bestOption.fret,
                    reachable: true,
                    alternative: true
                });
                previousString = bestOption.string;
            } else {
                tabData.push({
                    note: note.token,
                    midi: note.midi,
                    string: null,
                    fret: null,
                    reachable: false
                });
                previousString = -1;
            }
        }
        
        return { tabData };
    }
    
    transposeNotes(notesArray, semitones) {
        return notesArray.map(note => ({
            token: midiToNote(note.midi + semitones),
            midi: note.midi + semitones,
            originalToken: note.token
        }));
    }
    
    shiftOctave(notesArray, octaves) {
        const semitones = octaves * 12;
        return notesArray.map(note => ({
            token: midiToNote(note.midi + semitones),
            midi: note.midi + semitones,
            originalToken: note.token
        }));
    }
    
    generateFormattedAscii(tabData, tuningNotes, title = "") {
        if (!tabData || tabData.length === 0) {
            return "Нет данных для отображения";
        }
        
        const stringsData = [[], [], []];
        
        for (let i = 0; i < tabData.length; i++) {
            const item = tabData[i];
            for (let s = 0; s < 3; s++) {
                if (item.reachable && item.string === s) {
                    stringsData[s].push(item.fret.toString());
                } else {
                    stringsData[s].push('-');
                }
            }
        }
        
        const colWidths = [];
        for (let i = 0; i < tabData.length; i++) {
            let maxWidth = 1;
            for (let s = 0; s < 3; s++) {
                const val = stringsData[s][i];
                maxWidth = Math.max(maxWidth, val.length);
            }
            colWidths.push(maxWidth);
        }
        
        const lines = [];
        if (title) lines.push(title);
        
        for (let stringIdx = 0; stringIdx < 3; stringIdx++) {
            const stringName = this.stringDisplayNames[stringIdx];
            const stringNote = tuningNotes[stringIdx];
            const values = stringsData[stringIdx];
            
            let line = `${stringName} (${stringNote}): |`;
            for (let i = 0; i < values.length; i++) {
                const val = values[i];
                const width = colWidths[i];
                const padding = ' '.repeat(width - val.length);
                line += ` ${val}${padding} |`;
            }
            lines.push(line);
        }
        
        return lines.join('\n');
    }
}

const TUNING_PRESETS = {
    standard: ['D4', 'A3', 'D3'],
    'open-g': ['D4', 'G3', 'D3'],
    quartal: ['G3', 'C3', 'F3']
};

function parseTuningNote(noteStr) {
    const midi = parseNote(noteStr);
    if (midi === null) throw new Error(`Неверная нота строя: ${noteStr}`);
    return midi;
}

function getTuningMidi(tuningNames) {
    return tuningNames.map(name => parseTuningNote(name));
}

let currentTuningNames = ['D4', 'A3', 'D3'];
let currentTuningMidi = null;
let currentGenerator = null;
let currentNotes = [];
let currentTranspose = 0;
let currentOctaveShift = 0;
let lastDisplayedTabData = null;
let isAlternativeMode = false;

function displayTabulation(tabData, title = "") {
    const asciiTab = currentGenerator.generateFormattedAscii(tabData, currentTuningNames, title);
    const container = document.getElementById('ascii-tab-container');
    container.innerHTML = `<pre style="margin:0; font-family:'Roboto Mono',monospace; white-space:pre;">${escapeHtml(asciiTab)}</pre>`;
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function getCurrentNotesWithTransform() {
    if (!currentNotes || currentNotes.length === 0) {
        return null;
    }
    
    let transformed = currentNotes;
    if (currentOctaveShift !== 0) {
        transformed = currentGenerator.shiftOctave(transformed, currentOctaveShift);
    }
    if (currentTranspose !== 0) {
        transformed = currentGenerator.transposeNotes(transformed, currentTranspose);
    }
    return transformed;
}

function updateDisplayFromCurrentState() {
    if (!currentNotes || currentNotes.length === 0) {
        return;
    }
    
    const transformed = getCurrentNotesWithTransform();
    if (transformed) {
        const newInput = transformed.map(n => n.token).join(' ');
        document.getElementById('melody-input').value = newInput;
        
        const { tabData } = currentGenerator.generateTab(transformed);
        lastDisplayedTabData = tabData;
        isAlternativeMode = false;
        updateAlternativeButtonText();
        displayTabulation(tabData);
    }
}

function updateAlternativeButtonText() {
    const buttons = [
        document.getElementById('play-alternative'),
        document.getElementById('play-alternative-mobile')
    ];
    buttons.forEach(btn => {
        if (btn) {
            if (isAlternativeMode) {
                btn.innerHTML = '↺ Вернуть';
            } else {
                btn.innerHTML = '🎹 Сыграть иначе';
            }
        }
    });
}

function generateTabulation() {
    const input = document.getElementById('melody-input').value;
    if (!input.trim()) {
        showError('Введите ноты для генерации табулатуры');
        return;
    }
    
    hideErrors();
    
    const { notes, errors } = parseMelody(input);
    currentNotes = notes;
    currentTranspose = 0;
    currentOctaveShift = 0;
    updateTransposeDisplay();
    updateOctaveDisplay();
    
    if (notes.length === 0) {
        showError('Не распознано ни одной ноты. Примеры: Соль4, Ляb, Ab, Сиb3, Ре#2, до, ми-бемоль');
        return;
    }
    
    if (errors.length > 0) {
        showError(`Не распознаны: ${errors.join(', ')}`);
        return;
    }
    
    if (!currentGenerator) {
        showError('Строй не настроен');
        return;
    }
    
    const transformed = getCurrentNotesWithTransform();
    const { tabData } = currentGenerator.generateTab(transformed);
    lastDisplayedTabData = tabData;
    isAlternativeMode = false;
    updateAlternativeButtonText();
    displayTabulation(tabData);
}

function applyTranspose(semitones) {
    if (!currentNotes || currentNotes.length === 0) {
        showError('Сначала сгенерируйте табулатуру для мелодии');
        return;
    }
    
    currentTranspose += semitones;
    updateTransposeDisplay();
    isAlternativeMode = false;
    updateAlternativeButtonText();
    updateDisplayFromCurrentState();
}

function resetTranspose() {
    if (!currentNotes || currentNotes.length === 0) {
        return;
    }
    
    currentTranspose = 0;
    updateTransposeDisplay();
    isAlternativeMode = false;
    updateAlternativeButtonText();
    updateDisplayFromCurrentState();
}

function applyOctaveShift(octaves) {
    if (!currentNotes || currentNotes.length === 0) {
        showError('Сначала сгенерируйте табулатуру для мелодии');
        return;
    }
    
    currentOctaveShift += octaves;
    updateOctaveDisplay();
    isAlternativeMode = false;
    updateAlternativeButtonText();
    updateDisplayFromCurrentState();
}

function resetOctave() {
    if (!currentNotes || currentNotes.length === 0) {
        return;
    }
    
    currentOctaveShift = 0;
    updateOctaveDisplay();
    isAlternativeMode = false;
    updateAlternativeButtonText();
    updateDisplayFromCurrentState();
}

function updateTransposeDisplay() {
    const displays = [
        document.getElementById('transpose-value'),
        document.getElementById('transpose-value-mobile')
    ];
    displays.forEach(display => {
        if (display) display.textContent = currentTranspose;
    });
}

function updateOctaveDisplay() {
    const displays = [
        document.getElementById('octave-value'),
        document.getElementById('octave-value-mobile')
    ];
    displays.forEach(display => {
        if (display) {
            let text = currentOctaveShift;
            if (currentOctaveShift > 0) text = `+${currentOctaveShift}`;
            if (currentOctaveShift < 0) text = `${currentOctaveShift}`;
            display.textContent = text;
        }
    });
}

function generateAlternative() {
    if (!currentNotes || currentNotes.length === 0) {
        showError('Сначала сгенерируйте табулатуру для мелодии');
        return;
    }
    
    if (!currentGenerator) {
        showError('Строй не настроен');
        return;
    }
    
    const transformed = getCurrentNotesWithTransform();
    if (transformed) {
        if (!isAlternativeMode) {
            const { tabData } = currentGenerator.generateAlternativeTab(transformed);
            lastDisplayedTabData = tabData;
            isAlternativeMode = true;
            updateAlternativeButtonText();
            displayTabulation(tabData);
        } else {
            const { tabData } = currentGenerator.generateTab(transformed);
            lastDisplayedTabData = tabData;
            isAlternativeMode = false;
            updateAlternativeButtonText();
            displayTabulation(tabData);
        }
    }
}

function copyTabToClipboard() {
    const container = document.getElementById('ascii-tab-container');
    let textToCopy = '';
    
    const preElement = container.querySelector('pre');
    if (preElement) {
        textToCopy = preElement.textContent;
    } else {
        textToCopy = container.innerText || container.textContent;
    }
    
    if (!textToCopy || textToCopy.includes('Введите ноты')) {
        showError('Нет табулатуры для копирования. Сначала сгенерируйте табулатуру.');
        return;
    }
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        const copyBtns = [
            document.getElementById('copy-tab-btn'),
            document.getElementById('copy-tab-btn-mobile')
        ];
        copyBtns.forEach(btn => {
            if (btn) {
                const originalText = btn.textContent;
                btn.textContent = '✓ Скопировано!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            }
        });
    }).catch(err => {
        console.error('Ошибка копирования:', err);
        showError('Не удалось скопировать текст');
    });
}

function updateTuning(tuningNames) {
    try {
        const tuningMidi = getTuningMidi(tuningNames);
        currentTuningMidi = tuningMidi;
        currentTuningNames = [...tuningNames];
        currentGenerator = new DumbiraTabGenerator(tuningMidi);
        
        const displayStr = tuningNames.join(' · ');
        document.getElementById('tuning-display').textContent = displayStr;
        
        return true;
    } catch (error) {
        showError(error.message);
        return false;
    }
}

function showError(msg) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        if (errorDiv.style.display === 'block') errorDiv.style.display = 'none';
    }, 5000);
}

function hideErrors() {
    document.getElementById('error-message').style.display = 'none';
}

function init() {
    updateTuning(TUNING_PRESETS['open-g']);
    
    const tuningSelect = document.getElementById('tuning-preset-select');
    if (tuningSelect) {
        tuningSelect.value = 'open-g';
    }
    
    const customPanel = document.getElementById('custom-tuning-panel');
    
    tuningSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        
        if (value === 'custom') {
            customPanel.style.display = 'block';
        } else {
            customPanel.style.display = 'none';
            if (TUNING_PRESETS[value]) {
                updateTuning(TUNING_PRESETS[value]);
            }
        }
    });
    
    document.getElementById('apply-custom-tuning').addEventListener('click', () => {
        const s1 = document.getElementById('string1-custom').value.trim();
        const s2 = document.getElementById('string2-custom').value.trim();
        const s3 = document.getElementById('string3-custom').value.trim();
        
        if (!s1 || !s2 || !s3) {
            showError('Заполните все три струны для кастомного строя');
            return;
        }
        
        if (updateTuning([s1, s2, s3])) {
            tuningSelect.value = 'custom';
            customPanel.style.display = 'block';
        }
    });
    
    document.getElementById('generate-tab').addEventListener('click', generateTabulation);
    document.getElementById('copy-tab-btn').addEventListener('click', copyTabToClipboard);
    document.getElementById('copy-tab-btn-mobile').addEventListener('click', copyTabToClipboard);
    document.getElementById('transpose-up').addEventListener('click', () => applyTranspose(1));
    document.getElementById('transpose-down').addEventListener('click', () => applyTranspose(-1));
    document.getElementById('reset-transpose').addEventListener('click', resetTranspose);
    document.getElementById('transpose-up-mobile').addEventListener('click', () => applyTranspose(1));
    document.getElementById('transpose-down-mobile').addEventListener('click', () => applyTranspose(-1));
    document.getElementById('reset-transpose-mobile').addEventListener('click', resetTranspose);
    document.getElementById('octave-up').addEventListener('click', () => applyOctaveShift(1));
    document.getElementById('octave-down').addEventListener('click', () => applyOctaveShift(-1));
    document.getElementById('reset-octave').addEventListener('click', resetOctave);
    document.getElementById('octave-up-mobile').addEventListener('click', () => applyOctaveShift(1));
    document.getElementById('octave-down-mobile').addEventListener('click', () => applyOctaveShift(-1));
    document.getElementById('reset-octave-mobile').addEventListener('click', resetOctave);
    document.getElementById('play-alternative').addEventListener('click', generateAlternative);
    document.getElementById('play-alternative-mobile').addEventListener('click', generateAlternative);
    
    document.getElementById('clear-input').addEventListener('click', () => {
        document.getElementById('melody-input').value = '';
        currentNotes = [];
        currentTranspose = 0;
        currentOctaveShift = 0;
        isAlternativeMode = false;
        updateAlternativeButtonText();
        updateTransposeDisplay();
        updateOctaveDisplay();
        hideErrors();
        const container = document.getElementById('ascii-tab-container');
        container.innerHTML = '<span class="placeholder-text">📃 Введите ноты и нажмите «Показать табулатуру»</span>';
    });
    
    // Пример с разными форматами (включая Ляb)
    document.getElementById('melody-input').value = 'Ляb4 Соль4 Ляb4 Фа4 Миb4 Ре4';
}

window.addEventListener('DOMContentLoaded', init);