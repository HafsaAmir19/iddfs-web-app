document.addEventListener('DOMContentLoaded', function() {
    const gridElement = document.getElementById('grid');
    const statusMessage = document.getElementById('status-message');
    const findPathBtn = document.getElementById('findPathBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    let grid = [];
    let startPos = null;
    let goalPos = null;
    let currentPath = [];
    let cellElements = [];
    

    async function fetchGrid() {
        try {
            const response = await fetch('/get_grid');
            const data = await response.json();
            grid = data.grid;
            renderGrid();
        } catch (error) {
            console.error('Error fetching grid data:', error);
            statusMessage.textContent = 'Error loading grid data';
            statusMessage.classList.add('text-danger');
        }
    }
    
    
    function renderGrid() {
        gridElement.innerHTML = '';
        cellElements = [];
        
        for (let row = 0; row < 10; row++) {
            const rowElements = [];
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement('div');
                cell.className = grid[row][col] === 1 ? 'cell obstacle' : 'cell free';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', () => handleCellClick(row, col));
                
                gridElement.appendChild(cell);
                rowElements.push(cell);
            }
            cellElements.push(rowElements);
        }
        
        
        if (startPos !== null) {
            updateCellClass(startPos[0], startPos[1], 'start');
        }
        if (goalPos !== null) {
            updateCellClass(goalPos[0], goalPos[1], 'goal');
        }
        
        updateStatusMessage();
    }
    
    
    function updateCellClass(row, col, className) {
        const cell = cellElements[row][col];
        
       
        if (cell.classList.contains('start')) cell.classList.remove('start');
        if (cell.classList.contains('goal')) cell.classList.remove('goal');
        if (cell.classList.contains('path')) {
            cell.classList.remove('path');
            cell.removeAttribute('data-step');
        }
        
       
        if (className) {
            cell.classList.add(className);
        }
    }
    
    
    function handleCellClick(row, col) {
       
        if (grid[row][col] === 1) {
            statusMessage.textContent = 'Cannot select obstacle cells. Try again.';
            return;
        }
        
       
        clearPath();
        
        
        if (startPos === null) {
            startPos = [row, col];
            updateCellClass(row, col, 'start');
            updateStatusMessage();
            return;
        }
        
      
        if (goalPos === null) {
           
            if (startPos[0] === row && startPos[1] === col) {
                statusMessage.textContent = 'Goal cannot be the same as start. Try again.';
                return;
            }
            
            goalPos = [row, col];
            updateCellClass(row, col, 'goal');
            updateStatusMessage();
            return;
        }
       
        clearStartAndGoal();
        startPos = [row, col];
        updateCellClass(row, col, 'start');
        goalPos = null;
        updateStatusMessage();
    }
    
    
    function updateStatusMessage() {
        if (startPos === null) {
            statusMessage.textContent = 'Click to mark Start';
        } else if (goalPos === null) {
            statusMessage.textContent = 'Now click to set Goal';
        } else {
            statusMessage.textContent = 'Now click "Find Path" to run the algorithm';
        }
    }
    
    
    function clearPath() {
        for (const pos of currentPath) {
            if (pos[0] === startPos[0] && pos[1] === startPos[1]) {
                updateCellClass(pos[0], pos[1], 'start');
            } else if (pos[0] === goalPos[0] && pos[1] === goalPos[1]) {
                updateCellClass(pos[0], pos[1], 'goal');
            } else {
                updateCellClass(pos[0], pos[1], '');
            }
        }
        currentPath = [];
    }
    

    function clearStartAndGoal() {
        if (startPos !== null) {
            updateCellClass(startPos[0], startPos[1], '');
            startPos = null;
        }
        if (goalPos !== null) {
            updateCellClass(goalPos[0], goalPos[1], '');
            goalPos = null;
        }
    }
    

    function resetGrid() {
        clearPath();
        clearStartAndGoal();
       
        const pathCoordinatesContainer = document.getElementById('pathCoordinates');
        if (pathCoordinatesContainer) {
            pathCoordinatesContainer.remove();
        }
        
        updateStatusMessage();
    }
    
   
    async function animatePath(path) {
        statusMessage.textContent = 'Animating path traversal...';
        
    
        let pathCoordinatesContainer = document.getElementById('pathCoordinates');
        if (!pathCoordinatesContainer) {
            pathCoordinatesContainer = document.createElement('div');
            pathCoordinatesContainer.id = 'pathCoordinates';
            pathCoordinatesContainer.className = 'mt-3 bg-dark p-3 rounded';
            pathCoordinatesContainer.style.maxHeight = '200px';
            pathCoordinatesContainer.style.overflowY = 'auto';
            gridElement.parentElement.parentElement.appendChild(pathCoordinatesContainer);
        } else {
            pathCoordinatesContainer.innerHTML = '';
        }
        
        const header = document.createElement('h6');
        header.textContent = 'Path Coordinates (x,y):';
        header.className = 'mb-2';
        pathCoordinatesContainer.appendChild(header);
        
      
        const coordList = document.createElement('ul');
        coordList.className = 'list-group list-group-flush';
        pathCoordinatesContainer.appendChild(coordList);
        
      
        const delay = 200;
        
        for (let i = 0; i < path.length; i++) {
            const [row, col] = path[i];
            
            
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item bg-dark';
            
            const invertedY = 9 - row;  
            listItem.textContent = `Step ${i}: (${col}, ${invertedY})`;
            coordList.appendChild(listItem);
            
            
            if ((startPos[0] === row && startPos[1] === col) || 
                (goalPos[0] === row && goalPos[1] === col)) {
                continue;
            }
            
            const cell = cellElements[row][col];
            cell.classList.add('path');
            cell.dataset.step = i;
         
            await new Promise(resolve => setTimeout(resolve, delay));
            
            
            listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        statusMessage.textContent = `Path found! Total steps: ${path.length - 1}`;
    }
    
   
    async function findPath() {
       
        if (startPos === null || goalPos === null) {
            statusMessage.textContent = 'Set both start and goal positions first!';
            return;
        }
        
      
        clearPath();
        
        
        const oldPathCoordinates = document.getElementById('pathCoordinates');
        if (oldPathCoordinates) {
            oldPathCoordinates.remove();
        }
        
        statusMessage.textContent = 'Finding path using IDDFS...';
        
        try {
            const response = await fetch('/find_path', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    start: startPos,
                    goal: goalPos
                }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                currentPath = data.path;
                await animatePath(currentPath);
            } else {
                statusMessage.textContent = data.error || 'No path found.';
            }
        } catch (error) {
            console.error('Error finding path:', error);
            statusMessage.textContent = 'Error finding path. Please try again.';
        }
    }
    
   
    findPathBtn.addEventListener('click', findPath);
    resetBtn.addEventListener('click', resetGrid);
    
   
    fetchGrid();
});
