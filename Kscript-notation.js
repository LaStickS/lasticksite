(function() {
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
                
                // Получаем группы нот
                const groups = parseLineWithGroups(line, currentKuraiKey, currentOctave, manualReplacements, getNoteSequenceFromLine);
                
                if (groups.length === 0) continue;
                
                const lineDiv = document.createElement('div');
                lineDiv.style.position = 'relative';
                lineDiv.style.marginBottom = '10px';
                linesContainer.appendChild(lineDiv);
                
                // Подсчитываем общее количество нот
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
                
                // СОЗДАЕМ ВСЕ НОТЫ
                const allStaveNotes = [];
                const beams = [];
                
                for (const group of groups) {
                    const groupNotes = [];
                    // ВАЖНО: для группы используем длительность '8' (восьмые)
                    // Для одиночной ноты используем 'q' (четвертные)
                    const duration = group.length > 1 ? '8' : 'q';
                    
                    for (const noteData of group) {
                        const staveNote = createStaveNote(noteData.note, duration, VF);
                        groupNotes.push(staveNote);
                        allStaveNotes.push(staveNote);
                    }
                    
                    // СОЗДАЕМ BEAM ТОЛЬКО ДЛЯ ГРУПП ИЗ 2+ НОТ
                    if (group.length > 1) {
                        beams.push(new VF.Beam(groupNotes));
                    }
                }
                
                // ИСПОЛЬЗУЕМ FormatAndDraw - ЭТО ГЛАВНОЕ РЕШЕНИЕ!
                // Он сам разберется с тактами и длительностями
                VF.Formatter.FormatAndDraw(context, stave, allStaveNotes);
                
                // РИСУЕМ BEAMS ПОВЕРХ
                for (const beam of beams) {
                    beam.setContext(context).draw();
                }
                
                // Добавляем подписи аппликатуры
                addFingeringLabels(lineDiv, groups, width);
            }
            
        } catch (error) {
            console.error('Ошибка:', error);
            document.getElementById('staffCanvas').innerHTML = `<div class="error-message">Ошибка: ${error.message}</div>`;
        }
    }
    
    // Парсинг строки: пробелы разделяют группы, дефисы объединяют ноты в группе
    function parseLineWithGroups(line, currentKuraiKey, currentOctave, manualReplacements, getNoteSequenceFromLine) {
        const groups = [];
        
        // Разбиваем по пробелам
        const parts = line.trim().split(/\s+/);
        
        for (const part of parts) {
            if (part === '') continue;
            
            // Если есть дефис - это группа нот
            if (part.includes('-')) {
                const noteNames = part.split('-');
                const group = [];
                
                for (const noteName of noteNames) {
                    const normalizedNote = normalizeNoteName(noteName.trim());
                    if (normalizedNote) {
                        const tempSegments = [{ type: 'note', normalized: normalizedNote }];
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
                const normalizedNote = normalizeNoteName(part.trim());
                if (normalizedNote) {
                    const tempSegments = [{ type: 'note', normalized: normalizedNote }];
                    const notes = getNoteSequenceFromLine(tempSegments, currentKuraiKey, currentOctave, manualReplacements);
                    if (notes.length > 0) {
                        groups.push([notes[0]]);
                    }
                }
            }
        }
        
        return groups;
    }
    
    function normalizeNoteName(token) {
        const map = {
            'c': 'C', 'c#': 'C#', 'до': 'C', 'до#': 'C#',
            'd': 'D', 'd#': 'D#', 'ре': 'D', 'ре#': 'D#',
            'e': 'E', 'ми': 'E',
            'f': 'F', 'f#': 'F#', 'фа': 'F', 'фа#': 'F#',
            'g': 'G', 'g#': 'G#', 'соль': 'G', 'соль#': 'G#',
            'a': 'A', 'a#': 'A#', 'ля': 'A', 'ля#': 'A#',
            'b': 'B', 'си': 'B'
        };
        return map[token.toLowerCase()] || null;
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
            
            // Удаляем старые подписи
            const oldLabels = lineDiv.querySelector('.labels-wrapper');
            if (oldLabels) oldLabels.remove();
            
            // Создаем контейнер для подписей
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
                        label.className = 'fingering-label';  // ← Используем CSS класс вместо инлайн-стилей
                        label.style.left = (rect.left - lineRect.left + rect.width / 2 - 12) + 'px';
                        label.style.top = '0px';
                        wrapper.appendChild(label);
                    }
                    idx++;
                }
            }
        }, 150);
    }
    
    if (window.KuraiCore && window.KuraiCore.setRenderNotationCallback) {
        window.KuraiCore.setRenderNotationCallback(renderNotation);
    }
})();