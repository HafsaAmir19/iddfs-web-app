import os
import numpy as np
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key")


GRID = [
    [0, 0, 1, 0, 1, 1, 0, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0],
    [0, 0, 0, 1, 0, 0, 0, 0, 1, 0],
    [1, 1, 0, 1, 1, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 0, 1, 1, 0]
]


DIRECTIONS = [(0, 1), (0, -1), (1, 0), (-1, 0)]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_grid')
def get_grid():
    return jsonify({'grid': GRID})

def is_valid(grid, pos):
    """Check if a position is valid (within bounds and not an obstacle)"""
    x, y = pos
    return 0 <= x < len(grid) and 0 <= y < len(grid[0]) and grid[x][y] != 1

def iddfs(grid, start, goal):
    """Iterative Deepening Depth-First Search"""
    def dls(node, depth, visited, path):
        """Depth-Limited Search helper function for IDDFS"""
        if node == goal:
            return path
        
        if depth <= 0:
            return None
        
        visited.add(node)
        
        for direction in DIRECTIONS:
            nx, ny = node[0] + direction[0], node[1] + direction[1]
            next_node = (nx, ny)
            
            if is_valid(grid, next_node) and next_node not in visited:
            
                new_path = path + [next_node]
                
                
                result = dls(next_node, depth - 1, visited.copy(), new_path)
                

                if result:
                    return result
        
     
        return None

  
    max_depth = len(grid) * len(grid[0])  
    
    for depth in range(max_depth):
       
        visited = set()
        result = dls(start, depth, visited, [start])
        if result:
            return result
    
   
    return None

@app.route('/find_path', methods=['POST'])
def find_path():
    data = request.json
    start_pos = tuple(data.get('start'))
    goal_pos = tuple(data.get('goal'))
    
    if not start_pos or not goal_pos:
        return jsonify({'error': 'Start or goal position is missing'}), 400
    
    if not is_valid(GRID, start_pos) or not is_valid(GRID, goal_pos):
        return jsonify({'error': 'Invalid start or goal position'}), 400
    
    path = iddfs(GRID, start_pos, goal_pos)
    
    if path:
        return jsonify({'path': path})
    else:
        return jsonify({'error': 'No path found'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
