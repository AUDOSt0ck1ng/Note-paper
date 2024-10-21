const workspace = document.getElementById('workspace');
const addNoteBtn = document.getElementById('addNoteBtn');
const assistantBtn = document.getElementById('assistantBtn');

let zIndex = 1;

// 定義顏色組
const colors = {
    darkGray: '#3a3a3a',  // 深灰色（初始顏色）
    darkBlue: '#261f70',  // 深藍色
    beige: '#d9ccbb',     // 米色
    lightPurple: '#e6e6fa', // 淺紫色
    black: '#000000',     // 黑色（深色文字）
    white: '#ffffff',     // 白色（淺色文字）
    transparentBlack: 'rgba(0, 0, 0, 0.1)', // 半透明黑色
    transparentWhite: 'rgba(255, 255, 255, 0.2)', // 半透明白色
    placeholderDark: 'rgba(0, 0, 0, 0.6)', // 深色佔位符
    placeholderLight: 'rgba(255, 255, 255, 0.6)' // 淺色佔位符
};

// 判斷顏色是否為淺色
function isLightColor(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155;
}

function updateNoteColor(note, backgroundColor) {
    if (!note || typeof note !== 'object') {
        console.error('Invalid note object in updateNoteColor:', note);
        return;
    }
    note.style.backgroundColor = backgroundColor;
    const textarea = note.querySelector('textarea');
    const deleteBtn = note.querySelector('.delete-btn');

    if (!textarea || !deleteBtn) {
        console.warn('Some elements not found in note:', note);
        // 繼續執行，僅更新找到的元素
    }

    const isLightBackground = [colors.beige, colors.lightPurple].includes(backgroundColor);
    const textColor = isLightBackground ? colors.black : colors.white;

    note.style.color = textColor;
    if (textarea) textarea.style.color = textColor;
    if (deleteBtn) deleteBtn.style.color = textColor;

    const buttonBgColor = isLightBackground ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    if (deleteBtn) deleteBtn.style.backgroundColor = buttonBgColor;

    return textColor;
}

// 創建顏色選器
function createColorPicker(note) {
    const colorPicker = document.createElement('div');
    colorPicker.className = 'color-picker';
    
    Object.entries(colors).forEach(([name, color]) => {
        if (['darkGray', 'darkBlue', 'beige', 'lightPurple'].includes(name)) {
            const colorOption = document.createElement('div');
            colorOption.className = 'color-option';
            colorOption.style.backgroundColor = color;
            colorOption.addEventListener('click', () => {
                const textColor = updateNoteColor(note, color);
                note.dataset.textColor = textColor; // 保存文字顏色到 dataset
                hasUnsavedChanges = true;
            });
            colorPicker.appendChild(colorOption);
        }
    });

    return colorPicker;
}

// 全局變量來追踪便條紙的位置
let lastNotePosition = { x: 10, y: 10 };
const offsetX = 20; // 每個新便條紙向右偏移的距離
const offsetY = 20; // 每個新便條紙向下偏移的距離
const noteWidth = 200; // 便條紙的寬度
const noteHeight = 150; // 便條紙的高度
const maxRows = 3; // 最大行數

// 檢查位置並返回新的位置
function getNewNotePosition() {
    const workspace = document.getElementById('workspace');
    const workspaceWidth = workspace.clientWidth;
    const workspaceHeight = workspace.clientHeight;

    // 如果 X 座標超過工作區寬度的 2/3，或 Y 座標超過最大行數，重到左上角
    if (lastNotePosition.x + noteWidth > workspaceWidth * 2 / 3 || 
        lastNotePosition.y + noteHeight > noteHeight * maxRows) {
        lastNotePosition = { x: 10, y: 10 };
    } else {
        // 向右移動
        lastNotePosition.x += offsetX;
        
        // 如果到達工作區右邊界，換到下行
        if (lastNotePosition.x + noteWidth > workspaceWidth) {
            lastNotePosition.x = 10;
            lastNotePosition.y += offsetY;
        }
    }

    return { ...lastNotePosition };
}

// 添加便條紙
function addNote() {
    const note = document.createElement('div');
    note.className = 'note';
    
    const position = getNewNotePosition();
    note.style.left = `${position.x}px`;
    note.style.top = `${position.y}px`;

    const textarea = document.createElement('textarea');
    textarea.placeholder = '輸入內容...';
    note.appendChild(textarea);

    // 創建刪除按鈕
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.className = 'delete-btn';
    deleteBtn.addEventListener('click', () => workspace.removeChild(note));
    note.appendChild(deleteBtn);

    const colorPicker = createColorPicker(note);

    note.appendChild(colorPicker);
    workspace.appendChild(note);

    // 設置初始顏色為深灰色
    updateNoteColor(note, colors.darkGray);

    // 讓便條紙可以被拖曳
    makeNoteDraggable(note);

    // 將新添加的便條紙置於頂層
    note.style.zIndex = getTopZIndex() + 1;
}

// 獲取當前最高的 z-index 值
function getTopZIndex() {
    const notes = document.querySelectorAll('.note');
    return Math.max(0, ...Array.from(notes).map(note => 
        parseInt(window.getComputedStyle(note).zIndex, 10) || 0
    ));
}

// 獲取聊天關素
const chatWindow = document.getElementById('chatWindow');
const closeChatBtn = document.getElementById('closeChatBtn');
const userInput = document.getElementById('userInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const chatMessages = document.getElementById('chatMessages');

// 打開/關閉聊天窗口
assistantBtn.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
});

closeChatBtn.addEventListener('click', () => {
    chatWindow.classList.add('hidden');
});

// 發送消息
sendMessageBtn.addEventListener('click', () => sendMessage());
userInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        await sendMessage();
    }
});

async function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        chat_with_llm = true;
        userInput.value = '';
        // 處理命令
        if (message.startsWith('/')) {
            // 處理命令
            chat_with_llm = handleCommand(message);
            console.log(chat_with_llm);
        } 
        
        if (chat_with_llm[1]) {
            addMessage('user', message);
            
            if (chat_with_llm[0] != '') {
                userPrompt = chat_with_llm[0];
            }
            else {
                userPrompt = message;
            }

            try {
                const response = await fetch('http://localhost:3000/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    
                    body: JSON.stringify({ message: userPrompt }),
                });
                
                if (!response.ok) {
                    throw new Error('API 請求失敗');
                }
                
                const data = await response.json();
                addMessage('assistant', data.reply);
            } catch (error) {
                console.error('與 API 通信時出錯:', error);
                addMessage('assistant', '抱歉，我現在無法回應。請稍後再試。');
            }
        }
    }
}

function summaryNotes() {
    // 將所有便條紙的內容進行摘要
    const allNotes = Array.from(document.querySelectorAll('.note textarea')).map(textarea => textarea.value.trim()).filter(content => content !== '');
    const summary = allNotes.join('\n-----\n')+'\n\n請將以上各段內容進行摘要，但不要漏掉任何一段。';
    return [summary, true];
}

function clearNotes() {
    chatMessages.innerHTML = '';
    return ['', false];
}

function help() {
    addMessage('assistant', '這是一個幫助信息。');
    return ['', false];
}

function handleCommand(message) {
    const commandMap = {
        '/help': () => help(),
        '/clear': () => clearNotes(),
        '/summary': () => summaryNotes()
    };
    const action = commandMap[message];
    if (action) {
        return action();
    } else {
        addMessage('assistant', '未知的命令。');
        return ['未知的命令。', false];
    }
}

function addMessage(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    
    // 創建可複製的元素
    const textElement = document.createElement('pre');
    textElement.textContent = text; // 將文本設置為可複製的內容
    messageElement.appendChild(textElement);
    
    // 添加複製按鈕
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '複製';
    copyBtn.className = 'copy-btn'; // 添加類名以便於 CSS
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text).then(() => {
            alert('已複製到剪貼板！');
        }).catch(err => {
            console.error('複製失敗:', err);
        });
    });
    
    // 將複製按鈕添加到消息元素的右上角
    messageElement.appendChild(copyBtn);
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 讓便條紙可以被拖曳
function makeNoteDraggable(note) {
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startLeft, startTop;

    note.addEventListener('mousedown', (e) => {
        const rect = note.getBoundingClientRect();
        const isClickInResizeArea = e.clientX - rect.left > rect.width - 20 && 
                                    e.clientY - rect.top > rect.height - 20;
        const isClickInTextarea = e.target.tagName.toLowerCase() === 'textarea';

        if (!isClickInResizeArea && !isClickInTextarea) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = note.offsetLeft;
            startTop = note.offsetTop;
            note.style.zIndex = zIndex++;
            
            // 防止文本選擇
            e.preventDefault();
            
            // 添加 no-select 類
            note.classList.add('no-select');
            document.body.classList.add('no-select');
        } else if (isClickInResizeArea) {
            isResizing = true;
            startWidth = note.offsetWidth;
            startHeight = note.offsetHeight;
            startX = e.clientX;
            startY = e.clientY;
            
            // 防止文本選擇
            e.preventDefault();
        }
        // 如果點擊在文本區域，不做任何特殊處理，允許正常的文本編輯
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const newLeft = startLeft + dx;
            const newTop = startTop + dy;
            
            // 確保便條紙不會被拖出視窗
            const maxX = window.innerWidth - note.offsetWidth;
            const maxY = window.innerHeight - note.offsetHeight;
            
            note.style.left = `${Math.max(0, Math.min(newLeft, maxX))}px`;
            note.style.top = `${Math.max(0, Math.min(newTop, maxY))}px`;
        } else if (isResizing) {
            e.preventDefault();
            let newWidth = startWidth + (e.clientX - startX);
            let newHeight = startHeight + (e.clientY - startY);
            note.style.width = `${Math.max(150, Math.min(newWidth, window.innerWidth * 0.8))}px`;
            note.style.height = `${Math.max(100, Math.min(newHeight, window.innerHeight * 0.8))}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        isResizing = false;
        note.classList.remove('no-select');
        document.body.classList.remove('no-select');
    });
}

// 添加按鈕事監聽器
document.getElementById('addNoteBtn').addEventListener('click', addNote);

// 獲取刪除空便條紙按鈕
const deleteEmptyNotesBtn = document.getElementById('deleteEmptyNotesBtn');

// 添加點事件監器
deleteEmptyNotesBtn.addEventListener('click', deleteEmptyNotes);

// 刪除空便條紙的函數
function deleteEmptyNotes() {
    const notes = document.querySelectorAll('.note');
    let deletedCount = 0;

    notes.forEach(note => {
        const textarea = note.querySelector('textarea');
        if (textarea && textarea.value.trim() === '') {
            note.remove();
            deletedCount++;
        }
    });

    // 重置便條紙位置
    lastNotePosition = { x: 10, y: 10 };

    // 顯示刪除結果
    alert(`已刪除 ${deletedCount} 個空便條紙。`);
}

// 存所有便條紙到本地文件
async function saveAllNotes() {
    try {
        // 顯示正在保存的指示
        const savingIndicator = document.createElement('div');
        savingIndicator.textContent = '正在保存...';
        savingIndicator.style.position = 'fixed';
        savingIndicator.style.top = '50%';
        savingIndicator.style.left = '50%';
        savingIndicator.style.transform = 'translate(-50%, -50%)';
        savingIndicator.style.padding = '10px';
        savingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        savingIndicator.style.color = 'white';
        savingIndicator.style.borderRadius = '5px';
        savingIndicator.style.zIndex = '9999';
        document.body.appendChild(savingIndicator);

        const notes = Array.from(document.querySelectorAll('.note')).map(note => ({
            content: note.querySelector('textarea').value,
            left: note.style.left,
            top: note.style.top,
            width: note.style.width,
            height: note.style.height,
            zIndex: note.style.zIndex,
            backgroundColor: note.style.backgroundColor,
            textColor: note.querySelector('textarea').style.color // 新增：保存文字顏色
        }));

        const blob = new Blob([JSON.stringify(notes, null, 2)], {type: 'application/json'});

        // 使用 showSaveFilePicker API
        if ('showSaveFilePicker' in window) {
            const handle = await window.showSaveFilePicker({
                suggestedName: 'my_notes.json',
                types: [{
                    description: 'JSON File',
                    accept: {'application/json': ['.json']},
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
        } else {
            // 回退到舊方法
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'my_notes.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        hasUnsavedChanges = false;

        // 移除保存指示器並顯示成功消息
        document.body.removeChild(savingIndicator);
        alert('便條紙已成功保存！');
    } catch (error) {
        console.error('保存便條紙時出錯:', error);
        alert('保存便條紙時出錯。請稍後再試。');
    }
}

function loadAllNotes() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';

    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) {
            return; // 用戶沒有選擇文件，直接返回
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const notes = JSON.parse(e.target.result);
                console.log('Parsed notes:', notes); // 添加日誌
                workspace.innerHTML = ''; // 清空現有的便條紙
                notes.forEach((noteData, index) => {
                    console.log(`Creating note ${index + 1}:`, noteData); // 添加日誌
                    try {
                        createNoteFromData(noteData);
                    } catch (error) {
                        console.error(`Error creating note ${index + 1}:`, error); // 添加錯誤日誌
                    }
                });
                alert('便條紙已成功載入！');
                hasUnsavedChanges = false; // 重置未保存更改標誌
            } catch (error) {
                console.error('解析文件時出錯:', error);
                alert('載入便條紙時出錯。請確保選擇了正確的文件。');
            }
        };

        reader.onerror = function() {
            console.error('讀取文件時出錯');
            alert('讀取文件時出錯。請稍再試。');
        };

        reader.readAsText(file);
    };

    fileInput.click();
}

// 添加一個新的事件監聽器來處理取消操作
document.addEventListener('click', function(e) {
    if (e.target.type === 'file' && e.target.files.length === 0) {
        console.log('用戶取消了文件選擇');
        // 這裡可以添加一些額外的處理邏輯，如果需要的話
    }
}, true);

// 更新 HTML 中的按鈕
const saveBtn = document.getElementById('saveAllNotesBtn');
saveBtn.addEventListener('click', saveAllNotes);

const loadBtn = document.getElementById('loadAllNotesBtn');
loadBtn.addEventListener('click', loadAllNotes);

// 創建便條紙的函數
function createNote(left = '20px', top = '20px', content = '', width = '200px', height = '200px', zIndex = 1, backgroundColor = colors.darkGray) {
    const note = document.createElement('div');
    note.className = 'note';
    note.style.left = left;
    note.style.top = top;
    note.style.width = width;
    note.style.height = height;
    note.style.zIndex = zIndex;
    note.style.backgroundColor = backgroundColor;

    const textarea = document.createElement('textarea');
    textarea.value = content;
    textarea.placeholder = '輸入內容...';
    note.appendChild(textarea);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.addEventListener('click', () => {
        note.remove();
        hasUnsavedChanges = true;
    });
    note.appendChild(deleteBtn);

    // 移除顏色按鈕的創建

    const colorPicker = createColorPicker(note);
    note.appendChild(colorPicker);

    makeNoteDraggable(note);
    workspace.appendChild(note);

    updateNoteColor(note, backgroundColor);

    return note;
}

// 全局變量來追踪是否有未保存的更改
let hasUnsavedChanges = false;

// 定期提醒保存
setInterval(() => {
    if (hasUnsavedChanges) {
        const shouldSave = confirm('您有未保存的更改。是否要現在保存？');
        if (shouldSave) {
            saveAllNotes();
            hasUnsavedChanges = false;
        }
    }
}, 15 * 60 * 1000); // 15 分

// 離開頁面時提醒
window.addEventListener('beforeunload', (event) => {
    if (hasUnsavedChanges) {
        event.preventDefault(); // 取消事件
        event.returnValue = ''; // Chrome 需要設置 returnValue
    }
});

function createNoteFromData(noteData) {
    const note = createNote(
        noteData.left,
        noteData.top,
        noteData.content,
        noteData.width,
        noteData.height,
        noteData.zIndex,
        noteData.backgroundColor
    );
    
    // 確保顏色選擇器和拖拽功能正確應用
    const colorPicker = createColorPicker(note);
    note.appendChild(colorPicker);
    makeNoteDraggable(note);
    
    // 更新便條紙顏色和文字顏色
    updateNoteColor(note, noteData.backgroundColor);
    
    // 設置文字顏色
    const textarea = note.querySelector('textarea');
    if (noteData.textColor) {
        textarea.style.color = noteData.textColor;
    }
    
    workspace.appendChild(note);
}

function promptSaveChanges() {
    if (hasUnsavedChanges) {
        const shouldSave = confirm('您有未保存的更改。是否要現在保存？');
        if (shouldSave) {
            saveAllNotes();
        }
    }
}

window.addEventListener('beforeunload', (event) => {
    if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
    }
});

// 確保 DOM 已經加載完成
document.addEventListener('DOMContentLoaded', function() {
    const addNoteBtn = document.getElementById('addNoteBtn');
    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', addNote);
    } else {
        console.error('Add note button not found');
    }

    // 其他初始化代碼...
});
