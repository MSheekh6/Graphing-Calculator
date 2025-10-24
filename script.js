// Graph Calculator Application
class GraphCalculator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.functions = [];
        this.colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
        this.colorIndex = 0;
        
        // View settings
        this.view = {
            centerX: 0,
            centerY: 0,
            scale: 50, // pixels per unit
            minScale: 5,
            maxScale: 500
        };
        
        // Interaction state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.initCanvas();
        this.setupEventListeners();
        this.draw();
    }
    
    initCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width - 32; // Account for padding
        this.canvas.height = rect.height - 32;
        
        window.addEventListener('resize', () => {
            const rect = container.getBoundingClientRect();
            this.canvas.width = rect.width - 32;
            this.canvas.height = rect.height - 32;
            this.draw();
        });
    }
    
    setupEventListeners() {
        // Mouse events for panning
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                
                this.view.centerX -= dx / this.view.scale;
                this.view.centerY += dy / this.view.scale;
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                
                this.draw();
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
        
        // Mouse wheel for zooming
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = this.view.scale * zoomFactor;
            
            if (newScale >= this.view.minScale && newScale <= this.view.maxScale) {
                // Zoom toward mouse position
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                const worldX = this.screenToWorldX(mouseX);
                const worldY = this.screenToWorldY(mouseY);
                
                this.view.scale = newScale;
                
                const newWorldX = this.screenToWorldX(mouseX);
                const newWorldY = this.screenToWorldY(mouseY);
                
                this.view.centerX += worldX - newWorldX;
                this.view.centerY += worldY - newWorldY;
                
                this.draw();
            }
        });
    }
    
    screenToWorldX(screenX) {
        return (screenX - this.canvas.width / 2) / this.view.scale + this.view.centerX;
    }
    
    screenToWorldY(screenY) {
        return -(screenY - this.canvas.height / 2) / this.view.scale + this.view.centerY;
    }
    
    worldToScreenX(worldX) {
        return (worldX - this.view.centerX) * this.view.scale + this.canvas.width / 2;
    }
    
    worldToScreenY(worldY) {
        return -(worldY - this.view.centerY) * this.view.scale + this.canvas.height / 2;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw axes
        this.drawAxes();
        
        // Draw functions
        this.functions.forEach(func => {
            if (func.visible) {
                this.drawFunction(func);
            }
        });
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        
        const gridSpacing = this.calculateGridSpacing();
        
        // Vertical grid lines
        const startX = Math.floor(this.screenToWorldX(0) / gridSpacing) * gridSpacing;
        const endX = Math.ceil(this.screenToWorldX(this.canvas.width) / gridSpacing) * gridSpacing;
        
        for (let x = startX; x <= endX; x += gridSpacing) {
            const screenX = this.worldToScreenX(x);
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal grid lines
        const startY = Math.floor(this.screenToWorldY(this.canvas.height) / gridSpacing) * gridSpacing;
        const endY = Math.ceil(this.screenToWorldY(0) / gridSpacing) * gridSpacing;
        
        for (let y = startY; y <= endY; y += gridSpacing) {
            const screenY = this.worldToScreenY(y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.canvas.width, screenY);
            this.ctx.stroke();
        }
    }
    
    calculateGridSpacing() {
        const targetSpacing = 50; // pixels
        const worldSpacing = targetSpacing / this.view.scale;
        
        const magnitude = Math.pow(10, Math.floor(Math.log10(worldSpacing)));
        const normalized = worldSpacing / magnitude;
        
        let spacing;
        if (normalized <= 1) spacing = magnitude;
        else if (normalized <= 2) spacing = 2 * magnitude;
        else if (normalized <= 5) spacing = 5 * magnitude;
        else spacing = 10 * magnitude;
        
        return spacing;
    }
    
    drawAxes() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        
        const originX = this.worldToScreenX(0);
        const originY = this.worldToScreenY(0);
        
        // Y-axis
        if (originX >= 0 && originX <= this.canvas.width) {
            this.ctx.beginPath();
            this.ctx.moveTo(originX, 0);
            this.ctx.lineTo(originX, this.canvas.height);
            this.ctx.stroke();
        }
        
        // X-axis
        if (originY >= 0 && originY <= this.canvas.height) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, originY);
            this.ctx.lineTo(this.canvas.width, originY);
            this.ctx.stroke();
        }
        
        // Draw labels
        this.drawAxisLabels();
    }
    
    drawAxisLabels() {
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        
        const gridSpacing = this.calculateGridSpacing();
        const originX = this.worldToScreenX(0);
        const originY = this.worldToScreenY(0);
        
        // X-axis labels
        const startX = Math.floor(this.screenToWorldX(0) / gridSpacing) * gridSpacing;
        const endX = Math.ceil(this.screenToWorldX(this.canvas.width) / gridSpacing) * gridSpacing;
        
        for (let x = startX; x <= endX; x += gridSpacing) {
            if (Math.abs(x) < gridSpacing / 2) continue; // Skip zero
            
            const screenX = this.worldToScreenX(x);
            if (screenX >= 0 && screenX <= this.canvas.width) {
                const labelY = Math.min(Math.max(originY + 5, 15), this.canvas.height - 5);
                this.ctx.fillText(this.formatNumber(x), screenX, labelY);
            }
        }
        
        // Y-axis labels
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        
        const startY = Math.floor(this.screenToWorldY(this.canvas.height) / gridSpacing) * gridSpacing;
        const endY = Math.ceil(this.screenToWorldY(0) / gridSpacing) * gridSpacing;
        
        for (let y = startY; y <= endY; y += gridSpacing) {
            if (Math.abs(y) < gridSpacing / 2) continue; // Skip zero
            
            const screenY = this.worldToScreenY(y);
            if (screenY >= 0 && screenY <= this.canvas.height) {
                const labelX = Math.min(Math.max(originX - 5, 40), this.canvas.width - 5);
                this.ctx.fillText(this.formatNumber(y), labelX, screenY);
            }
        }
        
        // Draw origin label
        if (originX >= 0 && originX <= this.canvas.width && originY >= 0 && originY <= this.canvas.height) {
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText('0', originX - 5, originY + 5);
        }
    }
    
    formatNumber(num) {
        if (Math.abs(num) < 0.01 && num !== 0) {
            return num.toExponential(1);
        }
        if (Math.abs(num) >= 1000) {
            return num.toExponential(1);
        }
        return parseFloat(num.toFixed(2)).toString();
    }
    
    drawFunction(func) {
        this.ctx.strokeStyle = func.color;
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        
        const step = 1; // pixel step
        let previousY = null;
        let previousX = null;
        let hasStarted = false;
        
        for (let screenX = 0; screenX <= this.canvas.width; screenX += step) {
            const worldX = this.screenToWorldX(screenX);
            
            try {
                const scope = { x: worldX };
                const worldY = func.compiledExpr.evaluate(scope);
                
                if (isNaN(worldY) || !isFinite(worldY)) {
                    hasStarted = false;
                    previousY = null;
                    continue;
                }
                
                const screenY = this.worldToScreenY(worldY);
                
                // Check for discontinuities
                if (previousY !== null && Math.abs(screenY - previousY) > this.canvas.height / 2) {
                    hasStarted = false;
                }
                
                if (!hasStarted) {
                    this.ctx.moveTo(screenX, screenY);
                    hasStarted = true;
                } else {
                    this.ctx.lineTo(screenX, screenY);
                }
                
                previousY = screenY;
                previousX = screenX;
                
            } catch (e) {
                hasStarted = false;
                previousY = null;
            }
        }
        
        this.ctx.stroke();
    }
    
    addFunction(expression) {
        try {
            // Preprocess the expression to handle implicit multiplication
            let processedExpr = this.preprocessExpression(expression);
            
            // Compile the expression
            const compiled = math.compile(processedExpr);
            
            // Test evaluation
            const testScope = { x: 0 };
            compiled.evaluate(testScope);
            
            const color = this.colors[this.colorIndex % this.colors.length];
            this.colorIndex++;
            
            const func = {
                id: Date.now(),
                expression: expression,
                processedExpression: processedExpr,
                compiledExpr: compiled,
                color: color,
                visible: true
            };
            
            this.functions.push(func);
            this.draw();
            
            return { success: true, function: func };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    preprocessExpression(expr) {
        // Remove y = or f(x) = prefix if present
        expr = expr.replace(/^(y|f\(x\))\s*=\s*/, '');
        
        // Replace common notation
        expr = expr.replace(/\^/g, '^');  // Already correct, but keeping for clarity
        
        // Handle implicit multiplication: 2x -> 2*x, 3sin(x) -> 3*sin(x)
        expr = expr.replace(/(\d)([a-zA-Z])/g, '$1*$2');
        expr = expr.replace(/(\))(\d)/g, '$1*$2');
        expr = expr.replace(/(\d)(\()/g, '$1*$2');
        
        return expr;
    }
    
    removeFunction(id) {
        this.functions = this.functions.filter(f => f.id !== id);
        this.draw();
    }
    
    toggleFunction(id) {
        const func = this.functions.find(f => f.id === id);
        if (func) {
            func.visible = !func.visible;
            this.draw();
        }
        return func;
    }
    
    clearAll() {
        this.functions = [];
        this.colorIndex = 0;
        this.draw();
    }
    
    resetView() {
        this.view.centerX = 0;
        this.view.centerY = 0;
        this.view.scale = 50;
        this.draw();
    }
    
    autoScale() {
        if (this.functions.length === 0) return;
        
        // Sample points to find bounds
        let minX = -10, maxX = 10, minY = -10, maxY = 10;
        let hasValidPoints = false;
        
        this.functions.forEach(func => {
            if (!func.visible) return;
            
            for (let x = -20; x <= 20; x += 0.5) {
                try {
                    const scope = { x: x };
                    const y = func.compiledExpr.evaluate(scope);
                    
                    if (isFinite(y) && !isNaN(y) && Math.abs(y) < 1000) {
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                        hasValidPoints = true;
                    }
                } catch (e) {
                    // Skip invalid points
                }
            }
        });
        
        if (hasValidPoints) {
            const rangeX = maxX - minX;
            const rangeY = maxY - minY;
            const padding = 0.1;
            
            this.view.centerX = (minX + maxX) / 2;
            this.view.centerY = (minY + maxY) / 2;
            
            const scaleX = this.canvas.width / (rangeX * (1 + padding));
            const scaleY = this.canvas.height / (rangeY * (1 + padding));
            this.view.scale = Math.min(scaleX, scaleY, this.view.maxScale);
            this.view.scale = Math.max(this.view.scale, this.view.minScale);
            
            this.draw();
        }
    }
}

// UI Controller
class UIController {
    constructor(calculator) {
        this.calculator = calculator;
        this.functionInput = document.getElementById('functionInput');
        this.addButton = document.getElementById('addFunction');
        this.functionsList = document.getElementById('functionsList');
        this.errorMessage = document.getElementById('errorMessage');
        this.resetViewButton = document.getElementById('resetView');
        this.clearAllButton = document.getElementById('clearAll');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.addButton.addEventListener('click', () => this.addFunction());
        
        this.functionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addFunction();
            }
        });
        
        this.resetViewButton.addEventListener('click', () => {
            this.calculator.resetView();
        });
        
        this.clearAllButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all functions?')) {
                this.calculator.clearAll();
                this.renderFunctionsList();
            }
        });
    }
    
    addFunction() {
        const expression = this.functionInput.value.trim();
        
        if (!expression) {
            this.showError('Please enter a function');
            return;
        }
        
        const result = this.calculator.addFunction(expression);
        
        if (result.success) {
            this.functionInput.value = '';
            this.showError('');
            this.renderFunctionsList();
            
            // Auto-scale if this is the first function
            if (this.calculator.functions.length === 1) {
                setTimeout(() => this.calculator.autoScale(), 100);
            }
        } else {
            this.showError(`Invalid expression: ${result.error}`);
        }
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
    }
    
    renderFunctionsList() {
        this.functionsList.innerHTML = '';
        
        if (this.calculator.functions.length === 0) {
            this.functionsList.innerHTML = '<p style="color: #999; font-style: italic;">No functions added yet</p>';
            return;
        }
        
        this.calculator.functions.forEach(func => {
            const item = document.createElement('div');
            item.className = 'function-item';
            item.style.borderLeftColor = func.color;
            
            const colorIndicator = document.createElement('div');
            colorIndicator.className = 'color-indicator';
            colorIndicator.style.backgroundColor = func.color;
            
            const functionText = document.createElement('div');
            functionText.className = 'function-text';
            functionText.textContent = `y = ${func.expression}`;
            
            const controls = document.createElement('div');
            controls.className = 'function-controls';
            
            const toggleBtn = document.createElement('button');
            toggleBtn.className = `toggle-btn ${func.visible ? 'active' : ''}`;
            toggleBtn.textContent = func.visible ? 'Hide' : 'Show';
            toggleBtn.addEventListener('click', () => {
                const updatedFunc = this.calculator.toggleFunction(func.id);
                toggleBtn.className = `toggle-btn ${updatedFunc.visible ? 'active' : ''}`;
                toggleBtn.textContent = updatedFunc.visible ? 'Hide' : 'Show';
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                this.calculator.removeFunction(func.id);
                this.renderFunctionsList();
            });
            
            controls.appendChild(toggleBtn);
            controls.appendChild(deleteBtn);
            
            item.appendChild(colorIndicator);
            item.appendChild(functionText);
            item.appendChild(controls);
            
            this.functionsList.appendChild(item);
        });
    }
}

// Initialize the application
let calculator;
let uiController;

window.addEventListener('DOMContentLoaded', () => {
    calculator = new GraphCalculator('graphCanvas');
    uiController = new UIController(calculator);
    
    // Add some example functions for demonstration (can be removed)
    // calculator.addFunction('x^2');
    // calculator.addFunction('sin(x)');
    // calculator.addFunction('2*x + 1');
    // uiController.renderFunctionsList();
});
