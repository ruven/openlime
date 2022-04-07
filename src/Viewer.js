import { Canvas } from './Canvas.js'
import { Camera } from './Camera.js'

import { PointerManager } from './PointerManager.js'

/**
 * Manages an OpenLIME viewer functionality on a canvas
 * how do I write more substantial documentation.
 *
 * @param {div} div of the DOM or selector (es. '#canvasid'), or a canvas.
 * @param {string} options is a url to a JSON describing the viewer content
 * @param {object} options is a JSON describing the viewer content
 *  * **animate**: default *true*, calls requestAnimation() and manages refresh.
 *  * **background**: css style for background (overwrites css if present)
 * 
 * @example
 * const lime = new OpenLIME.OpenLIME('.openlime');
 * // .openlime is the class of a DIV element in the DOM.
 */

class Viewer {

    constructor(div, options) {

        Object.assign(this, {
            background: null,
            canvas: {},
            controllers: [],
            camera: new Camera()
        });


        if (typeof (div) == 'string')
            div = document.querySelector(div);

        if (!div)
            throw "Missing element parameter";

        Object.assign(this, options);
        if (this.background)
            div.style.background = this.background;

        this.containerElement = div;
        this.canvasElement = div.querySelector('canvas');
        if (!this.canvasElement) {
            this.canvasElement = document.createElement('canvas');
            div.prepend(this.canvasElement);
        }

        this.overlayElement = document.createElement('div');
        this.overlayElement.classList.add('openlime-overlay');
        this.containerElement.appendChild(this.overlayElement);


        this.canvas = new Canvas(this.canvasElement, this.overlayElement, this.camera, this.canvas);
        this.canvas.addEvent('update', () => { this.redraw(); });

        this.pointerManager = new PointerManager(this.overlayElement);

        this.canvasElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        var resizeobserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                this.resize(entry.contentRect.width, entry.contentRect.height);
            }
        });
        resizeobserver.observe(this.canvasElement);

        this.resize(this.canvasElement.clientWidth, this.canvasElement.clientHeight);
    }


    /* Convenience function, it actually passes to Canvas
    */
    addLayer(id, layer) {
        canvas.addLayer(id, layer);
    }

    /**
    * Resize the canvas (and the overlay) and triggers a redraw.
    */

    resize(width, height) {
        // Test with retina display!
        this.canvasElement.width = width * window.devicePixelRatio;
        this.canvasElement.height = height * window.devicePixelRatio;

        this.camera.setViewport({ x: 0, y: 0, dx: width, dy: height, w: width, h: height });
        this.canvas.prefetch();
        this.redraw();
    }

    /**
    *
    * Schedule a drawing.
    */
    redraw() {
        if (this.animaterequest) return;
        this.animaterequest = requestAnimationFrame((time) => { this.draw(time); });
    }

    /**
    * Do not call this if OpenLIME is animating, use redraw()
    * @param {time} time as in performance.now()
    */
    draw(time) {
        if (!time) time = performance.now();
        this.animaterequest = null;

        let viewport = this.camera.viewport;
        let transform = this.camera.getCurrentTransform(time);

        let done = this.canvas.draw(time);
        if (!done)
            this.redraw();
    }

}

export { Viewer };