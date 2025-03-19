class SudokuGame {
    constructor() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.timer = null;
        this.startTime = null;
        this.selectedCell = null;
        this.difficulty = 'easy';
        this.highlightMode = false;
        this.achievements = {
            'easy': { time: 300, title: '新手入门' },
            'medium': { time: 600, title: '中级玩家' },
            'hard': { time: 900, title: '数独大师' }
        };

        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        this.createBoard();
        this.setupTheme();
        this.loadGame();
    }

    createBoard() {
        const board = document.querySelector('.sudoku-board');
        board.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                board.appendChild(cell);
            }
        }
    }
    handleCellClick(cell) {
        if (this.selectedCell) {
            this.selectedCell.classList.remove('selected');
            // 移除之前的高亮
            if (this.highlightMode) {
                this.removeHighlightFromCells();
            }
        }
        
        this.selectedCell = cell;
        cell.classList.add('selected');

        // 高亮相同数字
        if (this.highlightMode && cell.textContent) {
            this.highlightSameNumbers(cell.textContent);
        }
    }

    setupEventListeners() {
        // 棋盘单元格点击事件
        document.querySelector('.sudoku-board').addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                this.handleCellClick(e.target);
            }
        });

        // 添加鼠标悬浮事件
        document.querySelector('.sudoku-board').addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('cell') && e.target.textContent && this.highlightMode) {
                this.removeHighlightFromCells();
                this.highlightSameNumbers(e.target.textContent);
            }
        });

        document.querySelector('.sudoku-board').addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('cell') && this.highlightMode) {
                this.removeHighlightFromCells();
                // 如果有选中的单元格，恢复其高亮
                if (this.selectedCell && this.selectedCell.textContent) {
                    this.highlightSameNumbers(this.selectedCell.textContent);
                }
            }
        });

        // 数字按钮点击事件
        document.querySelectorAll('.number').forEach(button => {
            button.addEventListener('click', () => {
                if (this.selectedCell) {
                    const number = parseInt(button.dataset.number);
                    this.fillNumber(number);
                }
            });
        });

        // 控制按钮事件
        document.getElementById('new-game').addEventListener('click', () => this.startNewGame());
        document.getElementById('show-solution').addEventListener('click', () => this.showSolution());
        document.getElementById('save-game').addEventListener('click', () => this.saveGame());
        document.getElementById('load-game').addEventListener('click', () => this.loadGame());
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });

        // 主题切换事件
        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });

        // 高亮模式切换事件
        document.getElementById('toggle-highlight').addEventListener('click', () => {
            this.toggleHighlightMode();
        });
    }

    generateSudoku() {
        // 生成完整的数独解
        this.generateSolution();
        
        // 根据难度移除数字
        const removeCount = {
            'easy': 30,
            'medium': 40,
            'hard': 50
        }[this.difficulty];

        this.board = this.solution.map(row => [...row]);
        this.removeNumbers(removeCount);
    }

    generateSolution() {
        // 先清空解决方案
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                this.solution[i][j] = 0;
            }
        }

        // 随机填充一些初始数字作为种子
        // 通过随机填充几个数字作为起点，可以增加每次生成解的多样性
        const seedCount = Math.floor(Math.random() * 5) + 3; // 随机填充3-7个数字
        for (let i = 0; i < seedCount; i++) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            const num = Math.floor(Math.random() * 9) + 1;
            
            // 只有在当前位置是有效的情况下才填充
            if (this.solution[row][col] === 0 && this.isValidMove(this.solution, row, col, num)) {
                this.solution[row][col] = num;
            }
        }
        
        const fillGrid = (grid) => {
            for (let i = 0; i < 81; i++) {
                const row = Math.floor(i / 9);
                const col = i % 9;
                
                if (grid[row][col] === 0) {
                    // 随机化数字排列顺序，增加生成的随机性
                    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                    this.shuffleArray(nums);
                    
                    for (let num of nums) {
                        if (this.isValidMove(grid, row, col, num)) {
                            grid[row][col] = num;
                            
                            if (i === 80 || fillGrid(grid)) {
                                return true;
                            }
                            
                            grid[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
            return true;
        };

        fillGrid(this.solution);
    }

    // 辅助方法：随机打乱数组
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    removeNumbers(count) {
        // 根据难度调整移除模式
        let positions = Array.from({length: 81}, (_, i) => i);
        this.shuffleArray(positions); // 随机打乱位置数组
        
        // 设置不同难度的移除策略
        let minDigitsPerRegion = 0;
        
        switch(this.difficulty) {
            case 'easy':
                minDigitsPerRegion = 3; // 每个3x3区域至少保留3个数字
                break;
            case 'medium':
                minDigitsPerRegion = 2; // 每个3x3区域至少保留2个数字
                break;
            case 'hard':
                minDigitsPerRegion = 1; // 每个3x3区域至少保留1个数字
                break;
        }
        
        // 计算每个区域当前的数字数量
        const getRegionDigits = () => {
            const regions = Array(9).fill(0);
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    if (this.board[i][j] !== 0) {
                        const regionIndex = Math.floor(i / 3) * 3 + Math.floor(j / 3);
                        regions[regionIndex]++;
                    }
                }
            }
            return regions;
        };
        
        // 移除数字，但确保每个区域保留足够的数字
        let removed = 0;
        for (let i = 0; i < positions.length && removed < count; i++) {
            const position = positions[i];
            const row = Math.floor(position / 9);
            const col = position % 9;
            
            // 计算该位置所在的区域
            const regionIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
            
            // 如果该区域的数字数量足够，可以移除
            const regionDigits = getRegionDigits();
            if (regionDigits[regionIndex] > minDigitsPerRegion && this.board[row][col] !== 0) {
                this.board[row][col] = 0;
                removed++;
            }
        }
        
        // 如果还需要移除更多数字（可能因为区域限制导致无法达到目标数量）
        // 那么随机选择区域再次移除，但是保持游戏可解
        const remainingToRemove = count - removed;
        if (remainingToRemove > 0) {
            this.shuffleArray(positions);
            for (let i = 0; i < positions.length && removed < count; i++) {
                const position = positions[i];
                const row = Math.floor(position / 9);
                const col = position % 9;
                
                if (this.board[row][col] !== 0) {
                    // 暂存当前值
                    const temp = this.board[row][col];
                    // 尝试移除
                    this.board[row][col] = 0;
                    removed++;
                }
            }
        }
    }

    isValidMove(grid, row, col, num) {
        // 检查行
        for (let x = 0; x < 9; x++) {
            if (grid[row][x] === num) return false;
        }
        
        // 检查列
        for (let x = 0; x < 9; x++) {
            if (grid[x][col] === num) return false;
        }
        
        // 检查3x3宫格
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[boxRow + i][boxCol + j] === num) return false;
            }
        }
        
        return true;
    }
    toggleHighlightMode() {
        this.highlightMode = !this.highlightMode;
        const button = document.getElementById('toggle-highlight');
        button.textContent = `高亮模式: ${this.highlightMode ? '开启' : '关闭'}`;

        // 如果当前有选中的单元格，更新高亮状态
        if (this.selectedCell && this.selectedCell.textContent) {
            if (this.highlightMode) {
                this.highlightSameNumbers(this.selectedCell.textContent);
            } else {
                this.removeHighlightFromCells();
            }
        }
    }

    highlightSameNumbers(number) {
        this.removeHighlightFromCells();
        document.querySelectorAll('.cell').forEach(cell => {
            if (cell.textContent === number) {
                cell.classList.add('highlight-same');
            }
        });
    }

    removeHighlightFromCells() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('highlight-same');
        });
    }

    fillNumber(number) {
        if (!this.selectedCell || this.selectedCell.classList.contains('fixed')) return;
        
        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);
        
        if (number === 0) {
            this.board[row][col] = 0;
            this.selectedCell.textContent = '';
            this.selectedCell.classList.remove('error');
            if (this.highlightMode) {
                this.removeHighlightFromCells();
            }
        } else {
            this.board[row][col] = number;
            this.selectedCell.textContent = number;
            
            // 检查是否符合数独规则
            if (!this.isValidMove(this.board, row, col, number)) {
                this.selectedCell.classList.add('error');
            } else {
                this.selectedCell.classList.remove('error');
                
                // 检查是否完成游戏
                if (this.checkWin()) {
                    this.handleWin();
                }
            }

            // 如果高亮模式开启，高亮相同数字
            if (this.highlightMode) {
                this.highlightSameNumbers(number.toString());
            }
        }
    }

    startNewGame() {
        this.generateSudoku();
        this.renderBoard();
        this.startTimer();
    }

    renderBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const value = this.board[row][col];
            
            cell.textContent = value || '';
            cell.classList.remove('fixed', 'error');
            
            if (value !== 0) {
                cell.classList.add('fixed');
            }
        });
    }

    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.startTime = Date.now();
        this.timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('time').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    checkWin() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] !== this.solution[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }

    handleWin() {
        clearInterval(this.timer);
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        
        // 更新成就
        const achievement = this.achievements[this.difficulty];
        if (elapsed <= achievement.time) {
            document.getElementById('current-achievement').textContent = achievement.title;
        }
        
        alert(`恭喜你完成了游戏！用时：${Math.floor(elapsed / 60)}分${elapsed % 60}秒`);
    }

    showSolution() {
        this.board = this.solution.map(row => [...row]);
        this.renderBoard();
        clearInterval(this.timer);
    }

    saveGame() {
        const gameState = {
            board: this.board,
            solution: this.solution,
            time: Date.now() - this.startTime,
            difficulty: this.difficulty
        };
        localStorage.setItem('sudokuGame', JSON.stringify(gameState));
        alert('游戏已保存');
    }

    loadGame() {
        const savedGame = localStorage.getItem('sudokuGame');
        if (savedGame) {
            const gameState = JSON.parse(savedGame);
            this.board = gameState.board;
            this.solution = gameState.solution;
            this.difficulty = gameState.difficulty;
            document.getElementById('difficulty').value = this.difficulty;
            
            this.renderBoard();
            this.startTime = Date.now() - gameState.time;
            this.startTimer();
        }
    }

    setupTheme() {
        const theme = localStorage.getItem('sudokuTheme') || 'classic';
        document.getElementById('theme-select').value = theme;
        this.changeTheme(theme);
    }

    changeTheme(theme) {
        document.body.dataset.theme = theme;
        localStorage.setItem('sudokuTheme', theme);
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});

