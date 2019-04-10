class Tweens {
    constructor() {
        this.activeForTweens = false;
        this.processFrame = true;
        this.tweenTargets = [];
        this.fps = 60;
    }

    addTween(o, duration, vars, delay, easing, overwrite, onComplete) {
        let v = null;
        for (const prop in vars) {
            if (!v) { v = {}; }
            v[prop] = { b: o[prop], c: vars[prop] - o[prop] };
        }
        
        if (v) {
            const t = {
                target : 		o,
                duration : 		duration,
                easingFunc : 	getEasingFunc(easing),
                overwrite : 	overwrite || false,
                onComplete : 	onComplete || null,
                totalFrames : 	duration * this.fps,
                delayFrame:     delay * this.fps,
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
                        console.log(o, t);
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
                    if (t.currentFrame >= t.delayFrame) {
                        const vars = t.vars;
                        for (const prop in vars)
                        {
                            o[prop] = t.easingFunc(t.currentFrame - t.delayFrame, vars[prop].b, vars[prop].c, t.totalFrames);
                        }
                        
                        if (t.currentFrame - t.delayFrame >= t.totalFrames) {
                            const onComplete = t.onComplete;
                            if (this.removeTween(o, t)) {
                                i--; len--;
                            }
                            j--;

                            if (onComplete) { onComplete(); }
                        }
                    }
                }
            }
        }
    }

}