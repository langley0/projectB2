const EasingFunction = {
    linear(w) {
        return w
    },

    outCubic(w) {
        w = w -1
        return w*w*w + 1
    },

    inCubic(w) {
        return w*w*w
    },

    inOutCubic(w) {
        w = w * 2
        if (w < 1) {
            return w*w*w / 2
        } else {
            w = w - 2
            return (w*w*w + 2) / 2
        }
    },

    inOutSine(w) {
        return (1 - Math.cos(Math.PI * w)) / 2
    },

    outExponential(w) {
        if (w < 1) {
            return 1- Math.pow(2, -10*w)
        } else {
            return 1
        }
    },

    outBounce(w) {
        if (w < 4/11.0) {
            return (121 * w * w) / 16.0
        } else if (w < 8/11.0) {
            return  (363 / 40.0 * w * w) - (99 / 10.0 * w) + 17/5.0
        } else if (w < 9/10.0) {
            return (4356 / 361.0 * w * w) - (35442 / 1805.0 * w) + 16061/1805.0
        } else {
            return (54 / 5.0 * w * w) - (513 / 25.0 * w) + 268/25.0
        }
    },

    outBack(w) {
        const s = 1.70158
        w = w - 1
        return w*w*((s+1)*w+s) + 1
    }
};

const MoveClipPlayMode = {
    Loop: 1,
    Stop: 2,
    Destory: 3
}

class MovieClip {
    static Timeline(startFrame, endFrame, mesh, tweens) {
        if (!Array.isArray(tweens)) {
            tweens = [tweens]
        }

        return {
            startFrame: startFrame,
            endFrame: endFrame,
            mesh: mesh,
            tweens: tweens
        }
    }

    constructor(...timelines) {

        if (!Array.isArray(timelines)) {
            timelines = [timelines]
        }
        
        this._timelines = timelines
        this._frame = 0
        this._playing = false
        this._stopHandler = null
        this._mode = MoveClipPlayMode.Stop // 마지막에 정지가 가장 기본 모드이다

        // 마지막 프레임을 찾는다
        let lastFrame = 0
        for(const tl of timelines) {
            lastFrame = Math.max(lastFrame, tl.endFrame)
        }
        this._lastFrame = lastFrame
    }
    
    playAndStop(handler) {
        // 가장 기본적인 실행을 한다
        // 마지막 프레임이 지나면 정지를 한다
        this._playing = true
        this._mode = MoveClipPlayMode.Stop
        this._stopHandler = handler
    }

    playAndDestroy(handler) {
        this._playing = true
        this._mode = MoveClipPlayMode.Destory
        this._stopHandler = handler
    }

    playLoop() {
        this._playing = true
        this._mode = MoveClipPlayMode.Loop
    }

    update() {
        this._frame++
        if (this._playing) {
            if (this._frame >= this._lastFrame) {
                // 플레이모드에 따라서 루프, 정지, 파괴를 선택한다
                switch(this._mode) {
                    case MoveClipPlayMode.Loop: {
                        this._frame = 1
                        break
                    }
                    case  MoveClipPlayMode.Destory: {
                        if (this._stopHandler) {
                            this._stopHandler()
                        }
                        return
                    }
                    default: {
                        // 정지시킨다
                        this._playing = false
                        this._frame = this._lastFrame
                        if (this._stopHandler) {
                            this._stopHandler()
                        }
                        break
                    }
                }
            }

            for(const timeline of this._timelines) {
                // 각각의 액션을 실행한다
                if (this._frame < timeline.startFrame || timeline.endFrame < this._frame) {
                    continue
                }

                const dist = timeline.endFrame - timeline.startFrame
                const weight = dist > 0 ? (this._frame - timeline.startFrame) / dist : 0
                const mesh = timeline.mesh;

                for(const tween of timeline.tweens) {
                    if (typeof(tween) === "function" ) {
                        tween();
                    } else {
                        // 나중에 고쳐두자...
                        const target = tween[0];
                        const from = tween[1];
                        const to = tween[2];
                        const easing = EasingFunction[tween[3]];

                        const value = easing(weight) * (to - from) + from
                        switch(target) {
                            case "scaleX": {
                                //mesh.setScale(value, image.scale.y)
                                break
                            }
                            case "scaleY": {
                                //image.setScale(image.scale.x, value)
                                break
                            }
                            case "scale": {
                                ///image.setScale(value, value)
                                break
                            }
                            case "x": {
                                //image.setPosition(value, image.y)
                                mesh.position.x = Math.floor(value);
                                break
                            }
                            case "y": {
                                //image.setPosition(image.x, value)
                                mesh.position.y = Math.floor(value);
                                break
                            }
                            case "alpha": {
                                mesh.alpha = value;
                                break
                            }
                            case "rotation": {
                                image.setRotation(value)
                                break
                            }
                        }
                    }
                }
            }
        }
    }
}