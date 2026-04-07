(function() {
    // Нормализация названий нот (русские и английские)
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
    
    // Функция для нормализации ноты
    function normalizeNoteName(token) {
        const lower = token.toLowerCase();
        return NOTE_ALIASES[lower] || null;
    }
    
    // Парсинг строки в массив токенов нот (поддерживает слитные ноты: DDD → три ноты D)
    function parseLineToNoteTokens(line) {
        const tokens = [];
        let i = 0;
        const len = line.length;
        
        while (i < len) {
            // Пропускаем пробелы
            if (line[i] === ' ' || line[i] === '\t') {
                i++;
                continue;
            }
            
            const remaining = line.substring(i);
            
            // Русские ноты с диезами
            const russianSharpMatch = remaining.match(/^(до#|до♯|ре#|ре♯|ми#|ми♯|фа#|фа♯|соль#|соль♯|ля#|ля♯|си#|си♯)/i);
            if (russianSharpMatch) {
                const token = russianSharpMatch[0];
                tokens.push({ type: 'note', original: token, normalized: normalizeNoteName(token) });
                i += token.length;
                continue;
            }
            
            // Русские ноты с бемолями
            const russianFlatMatch = remaining.match(/^(доб|до♭|реб|ре♭|миб|ми♭|фаб|фа♭|сольб|соль♭|ляб|ля♭|сиб|си♭)/i);
            if (russianFlatMatch) {
                const token = russianFlatMatch[0];
                tokens.push({ type: 'note', original: token, normalized: normalizeNoteName(token) });
                i += token.length;
                continue;
            }
            
            // Русские простые ноты
            const russianMatch = remaining.match(/^(до|ре|ми|фа|соль|ля|си)/i);
            if (russianMatch) {
                const token = russianMatch[0];
                tokens.push({ type: 'note', original: token, normalized: normalizeNoteName(token) });
                i += token.length;
                continue;
            }
            
            // Английские ноты с диезами/бемолями
            const englishSharpMatch = remaining.match(/^[A-Ga-g][#♯]/);
            if (englishSharpMatch) {
                const token = englishSharpMatch[0];
                tokens.push({ type: 'note', original: token, normalized: normalizeNoteName(token) });
                i += token.length;
                continue;
            }
            
            const englishFlatMatch = remaining.match(/^[A-Ga-g][b♭]/);
            if (englishFlatMatch) {
                const token = englishFlatMatch[0];
                tokens.push({ type: 'note', original: token, normalized: normalizeNoteName(token) });
                i += token.length;
                continue;
            }
            
            // Простые английские ноты
            const englishMatch = remaining.match(/^[A-Ga-g]/);
            if (englishMatch) {
                const token = englishMatch[0];
                tokens.push({ type: 'note', original: token, normalized: token.toUpperCase() });
                i += token.length;
                continue;
            }
            
            i++;
        }
        
        return tokens;
    }
    
    // Парсинг строки: пробелы разделяют группы, дефисы объединяют ноты в группе
    // Слитные ноты (DDD) автоматически объединяются в группу (как D-D-D)
    function parseLineWithGroups(line, currentKuraiKey, currentOctave, manualReplacements, getNoteSequenceFromLine) {
        const groups = [];
        
        // Разбиваем по пробелам
        const parts = line.trim().split(/\s+/);
        
        for (const part of parts) {
            if (part === '') continue;
            
            // Если есть дефис - это явная группа нот
            if (part.includes('-')) {
                const noteNames = part.split('-');
                const group = [];
                
                for (const noteName of noteNames) {
                    const trimmedNote = noteName.trim();
                    if (trimmedNote === '') continue;
                    
                    const tokens = parseLineToNoteTokens(trimmedNote);
                    for (const token of tokens) {
                        if (token.normalized) {
                            const tempSegments = [{ type: 'note', normalized: token.normalized }];
                            const notes = getNoteSequenceFromLine(tempSegments, currentKuraiKey, currentOctave, manualReplacements);
                            if (notes.length > 0) {
                                group.push(notes[0]);
                            }
                        }
                    }
                }
                
                if (group.length > 0) {
                    groups.push(group);
                }
            } else {
                // Нет дефиса - проверяем, сколько нот в этом слове
                const tokens = parseLineToNoteTokens(part);
                
                if (tokens.length === 0) continue;
                
                if (tokens.length > 1) {
                    // Слитное слово из нескольких нот (DDD) - создаем ОДНУ группу (как при D-D-D)
                    const group = [];
                    for (const token of tokens) {
                        if (token.normalized) {
                            const tempSegments = [{ type: 'note', normalized: token.normalized }];
                            const notes = getNoteSequenceFromLine(tempSegments, currentKuraiKey, currentOctave, manualReplacements);
                            if (notes.length > 0) {
                                group.push(notes[0]);
                            }
                        }
                    }
                    if (group.length > 0) {
                        groups.push(group);
                    }
                } else {
                    // Одиночная нота
                    for (const token of tokens) {
                        if (token.normalized) {
                            const tempSegments = [{ type: 'note', normalized: token.normalized }];
                            const notes = getNoteSequenceFromLine(tempSegments, currentKuraiKey, currentOctave, manualReplacements);
                            if (notes.length > 0) {
                                groups.push([notes[0]]);
                            }
                        }
                    }
                }
            }
        }
        
        return groups;
    }
    
    function createStaveNote(noteName, duration, VF) {
        let noteWithOctave;
        let accidental = null;
        
        switch(noteName) {
            case 'C': noteWithOctave = 'c/4'; break;
            case 'C#': noteWithOctave = 'c/4'; accidental = '#'; break;
            case 'D': noteWithOctave = 'd/4'; break;
            case 'D#': noteWithOctave = 'd/4'; accidental = '#'; break;
            case 'E': noteWithOctave = 'e/4'; break;
            case 'F': noteWithOctave = 'f/4'; break;
            case 'F#': noteWithOctave = 'f/4'; accidental = '#'; break;
            case 'G': noteWithOctave = 'g/4'; break;
            case 'G#': noteWithOctave = 'g/4'; accidental = '#'; break;
            case 'A': noteWithOctave = 'a/4'; break;
            case 'A#': noteWithOctave = 'a/4'; accidental = '#'; break;
            case 'B': noteWithOctave = 'b/4'; break;
            default: noteWithOctave = 'c/4';
        }
        
        const note = new VF.StaveNote({
            keys: [noteWithOctave],
            duration: duration,
            auto_stem: true
        });
        
        if (accidental) {
            note.addModifier(new VF.Accidental(accidental), 0);
        }
        
        return note;
    }
    
    function addFingeringLabels(lineDiv, groups, width) {
        setTimeout(() => {
            const svg = lineDiv.querySelector('svg');
            if (!svg) return;
            
            const noteHeads = svg.querySelectorAll('.vf-notehead');
            if (noteHeads.length === 0) return;
            
            const lineRect = lineDiv.getBoundingClientRect();
            
            const oldLabels = lineDiv.querySelector('.labels-wrapper');
            if (oldLabels) oldLabels.remove();
            
            const wrapper = document.createElement('div');
            wrapper.className = 'labels-wrapper';
            wrapper.style.width = width + 'px';
            lineDiv.appendChild(wrapper);
            
            let idx = 0;
            for (const group of groups) {
                for (let i = 0; i < group.length && idx < noteHeads.length; i++) {
                    const rect = noteHeads[idx].getBoundingClientRect();
                    if (rect && rect.left) {
                        const label = document.createElement('div');
                        label.textContent = group[i].fingering;
                        label.className = 'fingering-label';
                        label.style.left = (rect.left - lineRect.left + rect.width / 2 - 12) + 'px';
                        label.style.top = '0px';
                        wrapper.appendChild(label);
                    }
                    idx++;
                }
            }
        }, 150);
    }
    
    function renderNotation() {
        const text = document.getElementById('notesInput').value;
        
        if (!text.trim()) {
            alert('Нет нот для отображения');
            return;
        }
        
        const container = document.getElementById('notationContainer');
        container.style.display = 'block';
        
        const staffCanvas = document.getElementById('staffCanvas');
        staffCanvas.innerHTML = '';
        
        try {
            const VF = Vex.Flow;
            
            const currentKuraiKey = window.KuraiCore.getCurrentKuraiKey();
            const currentOctave = window.KuraiCore.getCurrentOctave();
            const manualReplacements = window.KuraiCore.getManualReplacements();
            const getNoteSequenceFromLine = window.KuraiCore.getNoteSequenceFromLine;
            
            const lines = text.split(/\r?\n/);
            const linesContainer = document.createElement('div');
            linesContainer.style.display = 'flex';
            linesContainer.style.flexDirection = 'column';
            linesContainer.style.gap = '15px';
            staffCanvas.appendChild(linesContainer);
            
            let firstLine = true;
            
            for (const line of lines) {
                if (line.trim() === '') continue;
                
                const groups = parseLineWithGroups(line, currentKuraiKey, currentOctave, manualReplacements, getNoteSequenceFromLine);
                
                if (groups.length === 0) continue;
                
                const lineDiv = document.createElement('div');
                lineDiv.style.position = 'relative';
                lineDiv.style.marginBottom = '10px';
                linesContainer.appendChild(lineDiv);
                
                let totalNotes = 0;
                for (const group of groups) totalNotes += group.length;
                
                const width = Math.min(900, Math.max(300, totalNotes * 55 + 100));
                const height = 120;
                
                const renderer = new VF.Renderer(lineDiv, VF.Renderer.Backends.SVG);
                renderer.resize(width, height);
                const context = renderer.getContext();
                
                const stave = new VF.Stave(10, 15, width - 20);
                stave.addClef('treble');
                if (firstLine) {
                    stave.addTimeSignature('4/4');
                    firstLine = false;
                }
                stave.setContext(context).draw();
                
                const allStaveNotes = [];
                const beams = [];
                
                for (const group of groups) {
                    const groupNotes = [];
                    const duration = group.length > 1 ? '8' : 'q';
                    
                    for (const noteData of group) {
                        const staveNote = createStaveNote(noteData.note, duration, VF);
                        groupNotes.push(staveNote);
                        allStaveNotes.push(staveNote);
                    }
                    
                    if (group.length > 1) {
                        beams.push(new VF.Beam(groupNotes));
                    }
                }
                
                VF.Formatter.FormatAndDraw(context, stave, allStaveNotes);
                
                for (const beam of beams) {
                    beam.setContext(context).draw();
                }
                
                addFingeringLabels(lineDiv, groups, width);
            }
            
        } catch (error) {
            console.error('Ошибка:', error);
            document.getElementById('staffCanvas').innerHTML = `<div class="error-message">Ошибка: ${error.message}</div>`;
        }
    }
    
    if (window.KuraiCore && window.KuraiCore.setRenderNotationCallback) {
        window.KuraiCore.setRenderNotationCallback(renderNotation);
    }
})();