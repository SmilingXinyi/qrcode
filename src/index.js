/**
 * Created by Smiling Xinyi on 18/6/24.
 */

import qrcode from './qrcode_UTF8'

export default function (options) {

    const defaultOptions = {
        // render method: `'canvas'`, `'image'` or `'div'`
        render: 'canvas',

        // version range somewhere in 1 .. 40
        minVersion: 1,
        maxVersion: 40,

        // error correction level: `'L'`, `'M'`, `'Q'` or `'H'`
        ecLevel: 'L',

        // offset in pixel if drawn onto existing canvas
        left: 0,
        top: 0,

        // size in pixel
        size: 200,

        // code color or image element
        fill: '#000',

        // background color or image element, `null` for transparent background
        background: null,

        // content
        text: 'no text',

        // corner radius relative to module width: 0.0 .. 0.5
        radius: 0,

        // quiet zone in modules
        quiet: 0,

        // modes
        // 0: normal
        // 1: label strip
        // 2: label box
        // 3: image strip
        // 4: image box
        mode: 0,

        mSize: 0.1,
        mPosX: 0.5,
        mPosY: 0.5,

        label: 'no label',
        fontname: 'sans',
        fontcolor: '#000',

        image: null
    }

    const setting = Object.assign({}, defaultOptions, options)

    const hasCanvas = (function () {
        const elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    }());

    return createHTML(setting)

    // Wrapper for the original QR code generator.
    function createQRCode(text, level, version, quiet) {
        const qr = {};

        const vqr = qrcode(version, level);
        vqr.addData(text);
        vqr.make();

        quiet = quiet || 0;

        const qrModuleCount = vqr.getModuleCount();
        const quietModuleCount = vqr.getModuleCount() + 2 * quiet;

        function isDark(row, col) {
            row -= quiet;
            col -= quiet;

            if (row < 0 || row >= qrModuleCount || col < 0 || col >= qrModuleCount) {
                return false;
            }
            return vqr.isDark(row, col);
        }

        function addBlank(l, t, r, b) {
            const prevIsDark = qr.isDark;
            const moduleSize = 1 / quietModuleCount;

            qr.isDark = function (row, col) {
                const ml = col * moduleSize;
                const mt = row * moduleSize;
                const mr = ml + moduleSize;
                const mb = mt + moduleSize;

                return prevIsDark(row, col) && (l > mr || ml > r || t > mb || mt > b);
            };
        }

        qr.text = text;
        qr.level = level;
        qr.version = version;
        qr.moduleCount = quietModuleCount;
        qr.isDark = isDark;
        qr.addBlank = addBlank;

        return qr;
    }

    // Returns a minimal QR code for the given text starting with version `minVersion`.
    // Returns `undefined` if `text` is too long to be encoded in `maxVersion`.
    function createMinQRCode(text, level, minVersion, maxVersion, quiet) {
        minVersion = Math.max(1, minVersion || 1);
        maxVersion = Math.min(40, maxVersion || 40);
        for (let version = minVersion; version <= maxVersion; version += 1) {
            try {
                return createQRCode(text, level, version, quiet);
            } catch (err) {
                console.error('QRCode empty')
                throw err
            }
        }
        return undefined;
    }

    function drawBackgroundLabel(qr, context, settings) {
        const size = settings.size;
        const font = 'bold ' + settings.mSize * size + 'px ' + settings.fontname;

        // Todo add to docuemnt
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')

        ctx.font = font;

        const w = ctx.measureText(settings.label).width;
        const sh = settings.mSize;
        const sw = w / size;
        const sl = (1 - sw) * settings.mPosX;
        const st = (1 - sh) * settings.mPosY;
        const sr = sl + sw;
        const sb = st + sh;
        const pad = 0.01;

        if (settings.mode === 1) {
            // Strip
            qr.addBlank(0, st - pad, size, sb + pad);
        } else {
            // Box
            qr.addBlank(sl - pad, st - pad, sr + pad, sb + pad);
        }

        context.fillStyle = settings.fontcolor;
        context.font = font;
        context.fillText(settings.label, sl * size, st * size + 0.75 * settings.mSize * size);
    }

    function drawBackgroundImage(qr, context, settings) {
        const size = settings.size;
        const w = settings.image.naturalWidth || 1;
        const h = settings.image.naturalHeight || 1;
        const sh = settings.mSize;
        const sw = sh * w / h;
        const sl = (1 - sw) * settings.mPosX;
        const st = (1 - sh) * settings.mPosY;
        const sr = sl + sw;
        const sb = st + sh;
        const pad = 0.01;

        if (settings.mode === 3) {
            // Strip
            qr.addBlank(0, st - pad, size, sb + pad);
        } else {
            // Box
            qr.addBlank(sl - pad, st - pad, sr + pad, sb + pad);
        }

        context.drawImage(settings.image, sl * size, st * size, sw * size, sh * size);
    }

    function drawBackground(qr, context, settings) {
        // Todo check is right
        if (settings.background
            && document.querySelector(settings.background)
            && document.querySelector(settings.background).localName === 'img') {
            context.drawImage(settings.background, 0, 0, settings.size, settings.size);
        } else if (settings.background) {
            context.fillStyle = settings.background;
            context.fillRect(settings.left, settings.top, settings.size, settings.size);
        }

        const mode = settings.mode;
        if (mode === 1 || mode === 2) {
            drawBackgroundLabel(qr, context, settings);
        } else if (mode === 3 || mode === 4) {
            drawBackgroundImage(qr, context, settings);
        }
    }

    function drawModuleDefault(qr, context, settings, left, top, width, row, col) {
        if (qr.isDark(row, col)) {
            context.rect(left, top, width, width);
        }
    }

    function drawModuleRoundedDark(ctx, l, t, r, b, rad, nw, ne, se, sw) {
        if (nw) {
            ctx.moveTo(l + rad, t);
        } else {
            ctx.moveTo(l, t);
        }

        if (ne) {
            ctx.lineTo(r - rad, t);
            ctx.arcTo(r, t, r, b, rad);
        } else {
            ctx.lineTo(r, t);
        }

        if (se) {
            ctx.lineTo(r, b - rad);
            ctx.arcTo(r, b, l, b, rad);
        } else {
            ctx.lineTo(r, b);
        }

        if (sw) {
            ctx.lineTo(l + rad, b);
            ctx.arcTo(l, b, l, t, rad);
        } else {
            ctx.lineTo(l, b);
        }

        if (nw) {
            ctx.lineTo(l, t + rad);
            ctx.arcTo(l, t, r, t, rad);
        } else {
            ctx.lineTo(l, t);
        }
    }

    function drawModuleRoundendLight(ctx, l, t, r, b, rad, nw, ne, se, sw) {
        if (nw) {
            ctx.moveTo(l + rad, t);
            ctx.lineTo(l, t);
            ctx.lineTo(l, t + rad);
            ctx.arcTo(l, t, l + rad, t, rad);
        }

        if (ne) {
            ctx.moveTo(r - rad, t);
            ctx.lineTo(r, t);
            ctx.lineTo(r, t + rad);
            ctx.arcTo(r, t, r - rad, t, rad);
        }

        if (se) {
            ctx.moveTo(r - rad, b);
            ctx.lineTo(r, b);
            ctx.lineTo(r, b - rad);
            ctx.arcTo(r, b, r - rad, b, rad);
        }

        if (sw) {
            ctx.moveTo(l + rad, b);
            ctx.lineTo(l, b);
            ctx.lineTo(l, b - rad);
            ctx.arcTo(l, b, l + rad, b, rad);
        }
    }

    function drawModuleRounded(qr, context, settings, left, top, width, row, col) {
        const isDark = qr.isDark;
        const right = left + width;
        const bottom = top + width;
        const radius = settings.radius * width;
        const rowT = row - 1;
        const rowB = row + 1;
        const colL = col - 1;
        const colR = col + 1;
        const center = isDark(row, col);
        const northwest = isDark(rowT, colL);
        const north = isDark(rowT, col);
        const northeast = isDark(rowT, colR);
        const east = isDark(row, colR);
        const southeast = isDark(rowB, colR);
        const south = isDark(rowB, col);
        const southwest = isDark(rowB, colL);
        const west = isDark(row, colL);

        if (center) {
            drawModuleRoundedDark(context, left, top, right, bottom, radius, !north && !west, !north && !east, !south && !east, !south && !west);
        } else {
            drawModuleRoundendLight(context, left, top, right, bottom, radius, north && west && northwest, north && east && northeast, south && east && southeast, south && west && southwest);
        }
    }

    function drawModules(qr, context, settings) {
        const moduleCount = qr.moduleCount;
        const moduleSize = settings.size / moduleCount;
        let fn = drawModuleDefault;
        let row;
        let col;

        if (settings.radius > 0 && settings.radius <= 0.5) {
            fn = drawModuleRounded;
        }

        context.beginPath();
        for (row = 0; row < moduleCount; row += 1) {
            for (col = 0; col < moduleCount; col += 1) {
                const l = settings.left + col * moduleSize;
                const t = settings.top + row * moduleSize;
                const w = moduleSize;

                fn(qr, context, settings, l, t, w, row, col);
            }
        }
        if ((settings.fill
                && typeof settings.fill !== 'string'
                && document.querySelector(settings.fill)
                && document.querySelector(settings.fill).localName === 'img')) {
            context.strokeStyle = 'rgba(0,0,0,0.5)';
            context.lineWidth = 2;
            context.stroke();
            const prev = context.globalCompositeOperation;
            context.globalCompositeOperation = 'destination-out';
            context.fill();
            context.globalCompositeOperation = prev;

            context.clip();
            context.drawImage(settings.fill, 0, 0, settings.size, settings.size);
            context.restore();
        } else {
            context.fillStyle = settings.fill;
            context.fill();
        }
    }

    // Draws QR code to the given `canvas` and returns it.
    function drawOnCanvas(canvas, settings) {
        const qr = createMinQRCode(settings.text, settings.ecLevel, settings.minVersion, settings.maxVersion, settings.quiet);
        if (!qr) {
            return null;
        }

        // const $canvas = jq(canvas).data('qrcode', qr);
        canvas.setAttribute('data-qrcode', qr)
        // const context = $canvas[0].getContext('2d');
        const context = canvas.getContext('2d')

        drawBackground(qr, context, settings);
        drawModules(qr, context, settings);

        return canvas;
    }

    // Returns a `canvas` element representing the QR code for the given settings.
    function createCanvas(settings) {
        const canvas = document.createElement('canvas')
        canvas.setAttribute('width', settings.size)
        canvas.setAttribute('height', settings.size)
        return drawOnCanvas(canvas, settings);
    }

    // Returns an `image` element representing the QR code for the given settings.
    function createImage(settings) {
        return jq('<img/>').attr('src', createCanvas(settings)[0].toDataURL('image/png'));
    }

    // Returns a `div` element representing the QR code for the given settings.
    function createDiv(settings) {
        const qr = createMinQRCode(settings.text, settings.ecLevel, settings.minVersion, settings.maxVersion, settings.quiet);
        if (!qr) {
            return null;
        }

        // some shortcuts to improve compression
        const settings_size = settings.size;
        const settings_bgColor = settings.background;
        const math_floor = Math.floor;

        const moduleCount = qr.moduleCount;
        const moduleSize = math_floor(settings_size / moduleCount);
        const offset = math_floor(0.5 * (settings_size - moduleSize * moduleCount));

        let row;
        let col;

        const containerCSS = {
            position: 'relative',
            left: 0,
            top: 0,
            padding: 0,
            margin: 0,
            width: settings_size,
            height: settings_size
        };
        const darkCSS = {
            position: 'absolute',
            padding: 0,
            margin: 0,
            width: moduleSize,
            height: moduleSize,
            'background-color': settings.fill
        };

        const $div = jq('<div/>').data('qrcode', qr).css(containerCSS);

        if (settings_bgColor) {
            $div.css('background-color', settings_bgColor);
        }

        for (row = 0; row < moduleCount; row += 1) {
            for (col = 0; col < moduleCount; col += 1) {
                if (qr.isDark(row, col)) {
                    jq('<div/>')
                        .css(darkCSS)
                        .css({
                            left: offset + col * moduleSize,
                            top: offset + row * moduleSize
                        })
                        .appendTo($div);
                }
            }
        }

        return $div;
    }

    function createHTML(settings) {
        if (hasCanvas && settings.render === 'canvas') {
            return createCanvas(settings)
        } else if (hasCanvas && settings.render === 'image') {
            return createImage(settings)
        } else {
            return createDiv(settings)
        }
    }
}