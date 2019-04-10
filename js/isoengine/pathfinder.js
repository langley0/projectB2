class GridNode {
    constructor(x, y, weight) {
        this.x = x;
        this.y = y;
        this.weight = weight;
        this.ignoreCollide = false;
    }

    getCost(fromNeighbor) {
        // Take diagonal weight into consideration.
        if (fromNeighbor && fromNeighbor.x !== this.x && fromNeighbor.y !== this.y)
        {
            return this.weight * 1.41421;
        }
        return this.weight;
    }

    isWall() {
        if (this.ignoreCollide) {
            return false;
        } else {
            return this.weight === 0 || this.dynamicWeight === 0 ;
        }
    }
}

class BinaryHeap{
    constructor(scoreFunction) {
        this.content = [];
        this.scoreFunction = scoreFunction;
    }

    push(element) {
        // Add the new element to the end of the array.
        this.content.push(element);

        // Allow it to sink down.
        this.sinkDown(this.content.length - 1);
    }

    pop() {
        // Store the first element so we can return it later.
        const result = this.content[0];
        // Get the element at the end of the array.
        const end = this.content.pop();
        // If there are any elements left, put the end element at the
        // start, and let it bubble up.
        if (this.content.length > 0) {
            this.content[0] = end;
            this.bubbleUp(0);
        }
        return result;
    }

    remove(node) {
        const i = this.content.indexOf(node);

        // When it is found, the process seen in 'pop' is repeated
        // to fill up the hole.
        const end = this.content.pop();

        if (i !== this.content.length - 1) {
            this.content[i] = end;

            if (this.scoreFunction(end) < this.scoreFunction(node)) {
                this.sinkDown(i);
            }
            else {
                this.bubbleUp(i);
            }
        }
    }

    size() {
        return this.content.length;
    }

    rescoreElement(node) {
        this.sinkDown(this.content.indexOf(node));
    }

    sinkDown(n) {
        // Fetch the element that has to be sunk.
        const element = this.content[n];

        // When at 0, an element can not sink any further.
        while (n > 0) {

            // Compute the parent element's index, and fetch it.
            const parentN = ((n + 1) >> 1) - 1,
                parent = this.content[parentN];
            // Swap the elements if the parent is greater.
            if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                this.content[parentN] = element;
                this.content[n] = parent;
                // Update 'n' to continue at the new position.
                n = parentN;
            }
            // Found a parent that is less, no need to sink any further.
            else {
                break;
            }
        }
    }

    bubbleUp(n) {
        // Look up the target element and its score.
        const length = this.content.length,
            element = this.content[n],
            elemScore = this.scoreFunction(element);

        while(true) {
            // Compute the indices of the child elements.
            const child2N = (n + 1) << 1,
                child1N = child2N - 1;
            // This is used to store the new position of the element, if any.
            let swap = null,
                child1Score;
            // If the first child exists (is inside the array)...
            if (child1N < length) {
                // Look it up and compute its score.
                const child1 = this.content[child1N];
                child1Score = this.scoreFunction(child1);

                // If the score is less than our element's, we need to swap.
                if (child1Score < elemScore){
                    swap = child1N;
                }
            }

            // Do the same checks for the other child.
            if (child2N < length) {
                const child2 = this.content[child2N],
                    child2Score = this.scoreFunction(child2);
                if (child2Score < (swap === null ? elemScore : child1Score)) {
                    swap = child2N;
                }
            }

            // If the element needs to be moved, swap it, and continue.
            if (swap !== null) {
                this.content[n] = this.content[swap];
                this.content[swap] = element;
                n = swap;
            }
            // Otherwise, we are done.
            else {
                break;
            }
        }
    }
}

class PathFinder {
    constructor(width, height) {
        
        this.nodes = [];
        this.grid = [];
        for (let y = 0; y < height; y++)
        {
            this.grid.push([]);

            for (let x = 0; x < width; x++)
            {
                const node = new GridNode(x, y, 1);
                this.grid[y].push(node);
                this.nodes.push(node);
            }
        }
    }

    init() {
        this.dirtyNodes = [];
        for (let i = 0; i < this.nodes.length; i++)
        {
            this.cleanNode(this.nodes[i]);
        }
    }

    cleanNode(node) {
        node.f = 0;
        node.g = 0;
        node.h = 0;
        node.visited = false;
        node.closed = false;
        node.parent = null;
    }

    solve(originX, originY, destX, destY, ignoreTarget) {
        const start = this.grid[originY][originX];
        const end = this.grid[destY][destX];

        end.ignoreCollide = ignoreTarget;
        const result = this.search(start, end);
        end.ignoreCollide = false;
        
        return result && result.length > 0 ? result : null;
    }

    search(start, end) {
        this.init();
        const heuristic = (pos0, pos1) => {
            const d1 = Math.abs(pos1.x - pos0.x);
            const d2 = Math.abs(pos1.y - pos0.y);
            return d1 + d2;
        };

        const openHeap = new BinaryHeap((node) => node.f);

        let closestNode = start; // set the start node to be the closest if required
        start.h = heuristic(start, end);
        openHeap.push(start);
        
        while(openHeap.size() > 0) {

            // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
            const currentNode = openHeap.pop();

            // End case -- result has been found, return the traced path.
            if(currentNode === end) {
                return this.pathTo(currentNode);
            }

            // Normal case -- move currentNode from open to closed, process each of its neighbors.
            currentNode.closed = true;

            // Find all neighbors for the current node.
            const neighbors = this.neighbors(currentNode);

            for (let i = 0, il = neighbors.length; i < il; ++i) {
                const neighbor = neighbors[i];

                if (neighbor.closed || neighbor.isWall()) {
                    // Not a valid node to process, skip to next neighbor.
                    continue;
                }

                // The g score is the shortest distance from start to current node.
                // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
                const gScore = currentNode.g + neighbor.getCost(currentNode);
                const beenVisited = neighbor.visited;

                if (!beenVisited || gScore < neighbor.g) {

                    // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                    neighbor.visited = true;
                    neighbor.parent = currentNode;
                    neighbor.h = neighbor.h || heuristic(neighbor, end);
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;
                    this.markDirty(neighbor);
                   
                    // If the neighbour is closer than the current closestNode or if it's equally close but has
                    // a cheaper path than the current closest node then it becomes the closest node
                    if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
                        closestNode = neighbor;
                    }

                    if (!beenVisited) {
                        // Pushing to heap will put it in proper place based on the 'f' value.
                        openHeap.push(neighbor);
                    }
                    else {
                        // Already seen the node, but since it has been rescored we need to reorder it in the heap
                        openHeap.rescoreElement(neighbor);
                    }
                }
            }
        }

        return this.pathTo(closestNode);
    }

    pathTo(node) {
        let curr = node;
        const path = [];
        while(curr.parent) {
            path.push(curr);
            curr = curr.parent;
        }
        // return path.reverse();
        return path;
    }

    neighbors(node) {
        const ret = [],
            y = node.x,
            x = node.y,
            grid = this.grid;

        // West
        if(grid[x-1] && grid[x-1][y]) {
            ret.push(grid[x-1][y]);
        }

        // East
        if(grid[x+1] && grid[x+1][y]) {
            ret.push(grid[x+1][y]);
        }

        // South
        if(grid[x] && grid[x][y-1]) {
            ret.push(grid[x][y-1]);
        }

        // North
        if(grid[x] && grid[x][y+1]) {
            ret.push(grid[x][y+1]);
        }


        return ret;
    }

    markDirty(node) {
        this.dirtyNodes.push(node);
    }

    setCell(x, y, movable) {
	    this.grid[y][x].weight = movable ? 1 : 0;
    }

    setDynamicCell(x, y, movable) {
        this.grid[y][x].dynamicWeight = movable ? 1 : 0;
    }
}