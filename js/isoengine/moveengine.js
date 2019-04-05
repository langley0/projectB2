const linearTween = function (t, b, c, d) {
    return c*t/d + b;
};
const easeInQuad = function (t, b, c, d) {
    t /= d;
    return c*t*t + b;
};
const easeOutQuad = function (t, b, c, d) {
    t /= d;
    return -c * t*(t-2) + b;
};
const easeOutQuad_ex = function (t, b, c, d) {
    t /= d;
    return Math.floor(-c * t*(t-2) + b);
};
const easeInOutQuad = function (t, b, c, d) {
    t /= d/2;
    if (t < 1) { return c/2*t*t + b; }
    t--;
    return -c/2 * (t*(t-2) - 1) + b;
};

getEasingFunc = function (e) {
    if (e === "easeInOut" || e === "easeInOutQuad" || e === "Quad.easeInOut")
    {
        return easeInOutQuad;
    }
    else if (e === "easeIn" || e === "easeInQuad" || e === "Quad.easeIn")
    {
        return easeInQuad;
    }
    else if (e === "easeOut" || e === "easeOutQuad" || e === "Quad.easeOut")
    {
        return easeOutQuad;
    }
    else if (e === "easeOut_ex") {
        return easeOutQuad_ex;
    }
    else
    {
        return linearTween;
    }
};

class MoveEngine {
    constructor(engine) {
        this.engine = engine;

        this.activeForMovables = false;
        this.activeForTweens = false;
        this.processFrame = true;
        
    
        this.movables = [];
        this.tweenTargets = [];

        this.fps = 60;
    }

    setObject(o, x, y) {
        this.object = o;
        this.speed = 8;

        const px = this.engine.getTilePosXFor(x, y);
        const py = this.engine.getTilePosYFor(x, y);

        this.speedUnit = getUnit({ x: (px - o.position.x), y: (py - o.position.y) });
        
        this.currentTarget = { x: px, y: py };
    }

    getUnit(v) {
        const m = Math.sqrt(v.x * v.x + v.y * v.y);
        return { x: v.x / m, y: v.y / m };
    };

    getDist(pos1, pos2) {
        const x = pos1.x - pos2.x;
        const y = pos1.y - pos2.y;
        return Math.sqrt(x*x + y*y);
    }

    addMovable(o) {
        if (this.movables.indexOf(o) >= 0) {
            return;
        }
        
        this.movables[this.movables.length] = o;

        o.positionR = { x: o.position.x, y: o.position.y };
        
        if (this.movables.length > 0 && !this.activeForMovables) {
            this.activeForMovables = true;
        }
    };

    removeMovable(o) {
        const idx = this.movables.indexOf(o); 
        if (idx !== -1)
        {
            o.positionR = null;
            o.speedUnit = { x: 0, y: 0 };
            this.movables.splice(idx, 1);
        }
        
        if (this.movables.length === 0)
        {
            this.activeForMovables = false;
        }
        
        // TODO: might be a good idea to remove/reset all related parameters from the object here
        
        return (idx !== -1);
    }

    setMoveParameters(o, x, y) {
        const px = this.engine.getTilePosXFor(x, y);
        const py = this.engine.getTilePosYFor(x, y);
        
        o.speedUnit = this.getUnit({ x: (px - o.position.x), y: (py - o.position.y) });
        o.currentTarget = { x: px, y: py };
        o.currentReachThresh = Math.ceil(Math.sqrt(o.speedUnit.x * o.speedUnit.x + o.speedUnit.y * o.speedUnit.y) * o.speedMagnitude);
    };

    addTween(o, duration, vars, delay, easing, overwrite, onComplete) {
        let v = null;
        for (const prop in vars) {
            if (o[prop] !== vars[prop]) {
                if (!v) { v = {}; }
                v[prop] = { b: o[prop], c: vars[prop] - o[prop] };
            }
        }
        
        if (v) {
            const t = {
                target : 		o,
                duration : 		duration,
                delay : 		Number(delay) || 0,
                easingFunc : 	getEasingFunc(easing),
                overwrite : 	overwrite || false,
                onComplete : 	onComplete || null,
                totalFrames : 	duration * this.fps,
                currentFrame : 	0,
                vars : 			v
            };
                    
            const idx = this.tweenTargets.indexOf(o); 
            if (idx >= 0) {
                let tweens = o.tweens;
                if (!tweens) {
                    tweens = [];
                }
                if (t.overwrite) {
                    for (let i=0; i < tweens.length; i++) {
                        tweens[i] = null;
                    }
                    tweens = [];
                }
                
                tweens[tweens.length] = t;
                o.tweens = tweens;
            } else {
                o.tweens = [t];
                this.tweenTargets[this.tweenTargets.length] = o;
            }
            
            if (this.tweenTargets.length > 0 && !this.activeForTweens) {
                this.activeForTweens = true;
            }
        }
    }

    removeTween(o, t) {
        let targetRemoved = false;
        
        if (o && t) {
            const idx = this.tweenTargets.indexOf(o); 
            if (idx >= 0) {
                if (this.tweenTargets[idx].tweens && this.tweenTargets[idx].tweens.length > 0) {
                    const tweens = this.tweenTargets[idx].tweens;
                    const idx2 = tweens.indexOf(t);
                    if (idx2 >= 0) {
                        t.onComplete = null;
                        t.easingFunc = null;
                        t.target = null;
                        
                        tweens.splice(idx2, 1);
                        if (tweens.length === 0) {
                            this.tweenTargets.splice(idx, 1);
                            targetRemoved = true;
                        }
                    } else {
                        throw new Error("No tween defined for this object");
                    }
                } else {
                    throw new Error("No tween defined for this object");
                }
            } else {
                throw new Error("No tween target defined for this object");
            }
            
            if (this.tweenTargets.length === 0) {
                this.activeForTweens = false;
            }
        }
        
        return targetRemoved;
    }

    update() {
        if (this.processFrame) {
            if (this.activeForMovables) {
                let len = this.movables.length;
                for (let i=0; i < len; i++)
                {
                    const o = this.movables[i];
                    
           
                    // check for target reach
                    if (o.currentTarget) {
                        const dist = this.getDist(o.positionR, o.currentTarget);
                        if (dist <= o.speedMagnitude) {
                            // reached to the target
                            o.position.x = o.currentTarget.x;
                            o.position.y = o.currentTarget.y;
                            
                            this.engine.onObjMoveStepEnd(o);
                            i--; len--;
                            continue; 
                        }
                    }
                  
                    o.positionR.x += o.speedMagnitude * o.speedUnit.x;
                    o.positionR.y += o.speedMagnitude * o.speedUnit.y;

                    o.position.x = Math.floor(o.positionR.x);
                    o.position.y = Math.floor(o.positionR.y);
                    
                    // check for tile change
                    this.engine.checkForTileChange(o);
                    this.engine.checkForFollowCharacter(o);
                }
            }
            
            if (this.activeForTweens) {   
                // and a loop for tween animations
                let len = this.tweenTargets.length;
                for (let i=0; i < len; i++)
                {
                    const o = this.tweenTargets[i];
                    const tweens = o.tweens;
                    for (let j=0; j < tweens.length; j++)
                    {
                        const t = tweens[j];
                        t.currentFrame++;
                        const vars = t.vars;
                        for (const prop in vars)
                        {
                            o[prop] = t.easingFunc(t.currentFrame, vars[prop].b, vars[prop].c, t.totalFrames);
                        }
                        
                        if (t.currentFrame >= t.totalFrames) {
                            if (t.onComplete) { t.onComplete(); }
                            if (this.removeTween(o, t)) 
                            {
                                i--; len--;
                            }
                            j--;
                        }
                    }
                }
            }
        }
    }
}