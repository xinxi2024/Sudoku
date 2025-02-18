class SudokuGame {
    constructor() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.timer = null;
        this.startTime = null;
        this.selectedCell = null;
        this.difficulty = 'easy';
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

    setupEventListeners() {
        // 棋盘单元格点击事件
        document.querySelector('.sudoku-board').addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                this.handleCellClick(e.target);
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
        const fillGrid = (grid) => {
            for (let i = 0; i < 81; i++) {
                const row = Math.floor(i / 9);
                const col = i % 9;
                
                if (grid[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
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

    removeNumbers(count) {
        const positions = Array.from({length: 81}, (_, i) => i);
        for (let i = 0; i < count; i++) {
            const index = Math.floor(Math.random() * positions.length);
            const position = positions.splice(index, 1)[0];
            const row = Math.floor(position / 9);
            const col = position % 9;
            this.board[row][col] = 0;
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

    handleCellClick(cell) {
        if (cell.classList.contains('fixed')) return;
        
        if (this.selectedCell) {
            this.selectedCell.classList.remove('selected');
        }
        
        this.selectedCell = cell;
        cell.classList.add('selected');
    }

    fillNumber(number) {
        if (!this.selectedCell || this.selectedCell.classList.contains('fixed')) return;
        
        const row = parseInt(this.selectedCell.dataset.row);
        const col = parseInt(this.selectedCell.dataset.col);
        
        if (number === 0) {
            this.board[row][col] = 0;
            this.selectedCell.textContent = '';
            this.selectedCell.classList.remove('error');
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
