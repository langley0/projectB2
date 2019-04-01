const vertex = `
    attribute vec2 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat3 projectionMatrix;

    varying vec2 vTextureCoord;

    void main(void)
    {
        gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
        vTextureCoord = aTextureCoord;
    }`;

class ExtractBrightnessFilter extends PIXI.Filter {
    constructor(threshold = 0.5) {
        

        const fragment = `
        uniform sampler2D uSampler;
        varying vec2 vTextureCoord;

        uniform float threshold;

        void main() {
            vec4 color = texture2D(uSampler, vTextureCoord);

            // A simple & fast algorithm for getting brightness.
            // It's inaccuracy , but good enought for this feature.
            float _max = max(max(color.r, color.g), color.b);
            float _min = min(min(color.r, color.g), color.b);
            float brightness = (_max + _min) * 0.5;

            if(brightness > threshold) {
                gl_FragColor = color;
            } else {
                gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            }
        }`;

        super(vertex, fragment);

        this.uniforms.threshold = threshold;
        this.threshold = threshold;
    }
}

class KawaseBlurFilter extends PIXI.Filter {
    constructor(blur = 4, quality = 3, clamp = false) {
        const fragment = `
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;

        uniform vec2 uOffset;

        void main(void)
        {
            vec4 color = vec4(0.0);

            // Sample top left pixel
            color += texture2D(uSampler, vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y + uOffset.y));

            // Sample top right pixel
            color += texture2D(uSampler, vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y + uOffset.y));

            // Sample bottom right pixel
            color += texture2D(uSampler, vec2(vTextureCoord.x + uOffset.x, vTextureCoord.y - uOffset.y));

            // Sample bottom left pixel
            color += texture2D(uSampler, vec2(vTextureCoord.x - uOffset.x, vTextureCoord.y - uOffset.y));

            // Average
            color *= 0.25;

            gl_FragColor = color;
        }`;
        super(vertex, fragment);
        this.uniforms.uOffset = new Float32Array(2);

        this._pixelSize = new PIXI.Point(1, 1);
        this._blur = blur;
        this._quality = Math.max(1, Math.round(quality));
        this._generateKernels();
    }

  
    apply(filterManager, input, output, clear) {
        const uvX = this._pixelSize.x / input.sourceFrame.width;
        const uvY = this._pixelSize.y / input.sourceFrame.height;
        let offset;

        if (this._quality === 1 || this._blur === 0) {
            offset = this._kernels[0] + 0.5;
            this.uniforms.uOffset[0] = offset * uvX;
            this.uniforms.uOffset[1] = offset * uvY;
            filterManager.applyFilter(this, input, output, clear);
        }
        else {
            const renderTarget = filterManager.getRenderTarget();

            let source = input;
            let target = renderTarget;
            let tmp;

            const last = this._quality - 1;

            for (let i = 0; i < last; i++) {
                offset = this._kernels[i] + 0.5;
                this.uniforms.uOffset[0] = offset * uvX;
                this.uniforms.uOffset[1] = offset * uvY;
                filterManager.applyFilter(this, source, target, true);

                tmp = source;
                source = target;
                target = tmp;
            }
            offset = this._kernels[last] + 0.5;
            this.uniforms.uOffset[0] = offset * uvX;
            this.uniforms.uOffset[1] = offset * uvY;
            filterManager.applyFilter(this, source, output, clear);

            filterManager.returnRenderTarget(renderTarget);
        }
    }

   
    _generateKernels() {
        const blur = this._blur;
        const quality = this._quality;
        const kernels = [ blur ];

        if (blur > 0) {
            let k = blur;
            const step = blur / quality;

            for (let i = 1; i < quality; i++) {
                k -= step;
                kernels.push(k);
            }
        }

        this._kernels = kernels;
    }
}


class AdvancedBloomFilter extends PIXI.Filter {

    constructor(options) {
        const fragment = `
        uniform sampler2D uSampler;
        varying vec2 vTextureCoord;

        uniform sampler2D bloomTexture;
        uniform float bloomScale;
        uniform float brightness;

        void main() {
            vec4 color = texture2D(uSampler, vTextureCoord);
            color.rgb *= brightness;
            vec4 bloomColor = vec4(texture2D(bloomTexture, vTextureCoord).rgb, 0.0);
            bloomColor.rgb *= bloomScale;
            gl_FragColor = color + bloomColor;
        }`;

        super(vertex, fragment);

        if (typeof options === 'number') {
            options = { threshold: options };
        }

        options = Object.assign({
            threshold: 0.5,
            bloomScale: 0.5,
            brightness: 1,
            kernels: null,
            blur: 8,
            quality: 4,
            pixelSize: 2,
            resolution: PIXI.settings.RESOLUTION,
        }, options);

        this.bloomScale = options.bloomScale;
        this.brightness = options.brightness;

        const { blur, quality, pixelSize } = options;

        this._extractFilter = new ExtractBrightnessFilter(options.threshold);
        this._blurFilter = new KawaseBlurFilter(blur, quality);
        this._pixelSize = new PIXI.Point(pixelSize, pixelSize);
    }

    /**
     * Override existing apply method in PIXI.Filter
     * @private
     */
    apply(filterManager, input, output, clear, currentState) {
        const brightTarget = filterManager.getRenderTarget();
        this._extractFilter.apply(filterManager, input, brightTarget, true, currentState);

        const bloomTarget = filterManager.getRenderTarget();
        this._blurFilter.apply(filterManager, brightTarget, bloomTarget, true, currentState);


        this.uniforms.bloomScale = this.bloomScale;
        this.uniforms.brightness = this.brightness;
        this.uniforms.bloomTexture = bloomTarget;

        filterManager.applyFilter(this, input, output, clear);

        filterManager.returnRenderTarget(bloomTarget);
        filterManager.returnRenderTarget(brightTarget);
    }
}