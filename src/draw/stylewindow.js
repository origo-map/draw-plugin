import Origo from 'Origo';
import styleTemplate from './styletemplate';
import drawHandler from './drawhandler';

let fillColor;
let fillColorArr;
let fillOpacity;
let strokeColor;
let strokeColorArr;
let strokeOpacity;
let strokeWidth;
let strokeType;
let pointSize;
let pointType;
let textSize;
let textString;
let annotationField;
const textFont = '"Helvetica Neue", Helvetica, Arial, sans-serif';

function getStrokeType(lineDash) {
  if (!lineDash) {
    strokeType = 'line';
  } else if (lineDash.length === 2 && lineDash[0] === lineDash[1]) {
    strokeType = 'dash';
  } else if (lineDash.length === 2 && lineDash[0] < lineDash[1]) {
    strokeType = 'point';
  } else if (lineDash.length === 4) {
    strokeType = 'dash-point';
  } else {
    strokeType = 'line';
  }
  return strokeType;
}

function createRegularShape(type, size, fill, stroke) {
  let style;
  switch (type) {
    case 'square':
      style = new Origo.ol.style.Style({
        image: new Origo.ol.style.RegularShape({
          fill,
          stroke,
          points: 4,
          radius: size,
          angle: Math.PI / 4
        })
      });
      break;

    case 'triangle':
      style = new Origo.ol.style.Style({
        image: new Origo.ol.style.RegularShape({
          fill,
          stroke,
          points: 3,
          radius: size,
          rotation: 0,
          angle: 0
        })
      });
      break;

    case 'star':
      style = new Origo.ol.style.Style({
        image: new Origo.ol.style.RegularShape({
          fill,
          stroke,
          points: 5,
          radius: size,
          radius2: size / 2.5,
          angle: 0
        })
      });
      break;

    case 'cross':
      style = new Origo.ol.style.Style({
        image: new Origo.ol.style.RegularShape({
          fill,
          stroke,
          points: 4,
          radius: size,
          radius2: 0,
          angle: 0
        })
      });
      break;

    case 'x':
      style = new Origo.ol.style.Style({
        image: new Origo.ol.style.RegularShape({
          fill,
          stroke,
          points: 4,
          radius: size,
          radius2: 0,
          angle: Math.PI / 4
        })
      });
      break;

    case 'circle':
      style = new Origo.ol.style.Style({
        image: new Origo.ol.style.Circle({
          fill,
          stroke,
          radius: size
        })
      });
      break;

    default:
      style = new Origo.ol.style.Style({
        image: new Origo.ol.style.Circle({
          fill,
          stroke,
          radius: size
        })
      });
  }
  return style;
}

function rgbToArray(colorString, opacity = 1) {
  const colorArray = colorString.replace(/[^\d,.]/g, '').split(',');
  colorArray[3] = opacity;
  return colorArray;
}

function setFillColor(color) {
  fillColor = color;
  fillColorArr = rgbToArray(fillColor, fillOpacity);
}

function setStrokeColor(color) {
  strokeColor = color;
  strokeColorArr = rgbToArray(strokeColor, strokeOpacity);
}

function restoreStylewindow() {
  document.getElementById('o-draw-style-fill').classList.remove('hidden');
  document.getElementById('o-draw-style-stroke').classList.remove('hidden');
  document.getElementById('o-draw-style-point').classList.remove('hidden');
  document.getElementById('o-draw-style-text').classList.remove('hidden');
}

function updateStylewindow(feature) {
  let geometryType = feature.getGeometry().getType();
  if (feature.get(annotationField)) {
    geometryType = 'TextPoint';
  }
  switch (geometryType) {
    case 'LineString':
    case 'MultiLineString':
      document.getElementById('o-draw-style-fill').classList.add('hidden');
      document.getElementById('o-draw-style-point').classList.add('hidden');
      document.getElementById('o-draw-style-text').classList.add('hidden');
      break;
    case 'Polygon':
    case 'MultiPolygon':
      document.getElementById('o-draw-style-point').classList.add('hidden');
      document.getElementById('o-draw-style-text').classList.add('hidden');
      break;
    case 'Point':
    case 'MultiPoint':
      document.getElementById('o-draw-style-text').classList.add('hidden');
      break;
    case 'TextPoint':
      document.getElementById('o-draw-style-stroke').classList.add('hidden');
      document.getElementById('o-draw-style-point').classList.add('hidden');
      break;
    default:
      break;
  }
  const featureStyle = feature.getStyle();
  let featureStroke = featureStyle[0].getStroke();
  let featureFill = featureStyle[0].getFill();
  const featureText = featureStyle[0].getText();
  if (featureText) {
    featureFill = featureText.getFill();
    featureStroke = featureText.getStroke();
    const featureTextString = featureText.getText();
    const featureTextFont = featureText.getFont();
    const featureTextSize = featureTextFont.split('px')[0];
    document.getElementById('o-draw-style-textSizeSlider').value = featureTextSize;
    textSize = featureTextSize;
    document.getElementById('o-draw-style-textString').value = featureTextString;
    textString = featureTextString;
  }
  if (featureStroke) {
    const width = featureStroke.getWidth();
    const lineDash = featureStroke.getLineDash();
    const featureStrokeColor = featureStroke.getColor();
    const colorString = `rgb(${featureStrokeColor[0]},${featureStrokeColor[1]},${featureStrokeColor[2]})`;
    const strokeEl = document.getElementById('o-draw-style-strokeColor');
    const strokeInputEl = strokeEl.querySelector(`input[value = "${colorString}"]`);
    if (strokeInputEl) {
      strokeInputEl.checked = true;
    } else {
      const checkedEl = document.querySelector('input[name = "strokeColorRadio"]:checked');
      if (checkedEl) {
        checkedEl.checked = false;
      }
    }
    document.getElementById('o-draw-style-strokeWidthSlider').value = width;
    document.getElementById('o-draw-style-strokeOpacitySlider').value = featureStrokeColor[3];
    document.getElementById('o-draw-style-strokeType').value = strokeType;
    strokeWidth = width;
    strokeOpacity = featureStrokeColor[3];
    getStrokeType(lineDash);
    setStrokeColor(colorString);
  }
  if (featureFill) {
    const featureFillColor = featureFill.getColor();
    const colorString = `rgb(${featureFillColor[0]},${featureFillColor[1]},${featureFillColor[2]})`;
    const fillEl = document.getElementById('o-draw-style-fillColor');
    const fillInputEl = fillEl.querySelector(`input[value = "${colorString}"]`);
    if (fillInputEl) {
      fillInputEl.checked = true;
    } else {
      const checkedEl = document.querySelector('input[name = "fillColorRadio"]:checked');
      if (checkedEl) {
        checkedEl.checked = false;
      }
    }
    document.getElementById('o-draw-style-fillOpacitySlider').value = featureFillColor[3];
    fillOpacity = featureFillColor[3];
    setFillColor(colorString);
  }
}

function getStylewindowStyle(feature) {
  let geometryType = feature.getGeometry().getType();
  if (feature.get(annotationField)) {
    geometryType = 'TextPoint';
  }
  const style = [];
  let lineDash;
  if (strokeType === 'dash') {
    lineDash = [3 * strokeWidth, 3 * strokeWidth];
  } else if (strokeType === 'dash-point') {
    lineDash = [3 * strokeWidth, 3 * strokeWidth, 0.1, 3 * strokeWidth];
  } else if (strokeType === 'point') {
    lineDash = [0.1, 3 * strokeWidth];
  } else {
    lineDash = false;
  }

  const stroke = new Origo.ol.style.Stroke({
    color: strokeColorArr,
    width: strokeWidth,
    lineDash
  });
  const fill = new Origo.ol.style.Fill({
    color: fillColorArr
  });
  const font = `${textSize}px ${textFont}`;
  switch (geometryType) {
    case 'LineString':
    case 'MultiLineString':
      style[0] = new Origo.ol.style.Style({
        stroke
      });
      break;
    case 'Polygon':
    case 'MultiPolygon':
      style[0] = new Origo.ol.style.Style({
        fill,
        stroke
      });
      break;
    case 'Point':
    case 'MultiPoint':
      style[0] = createRegularShape(pointType, pointSize, fill, stroke);
      break;
    case 'TextPoint':
      style[0] = new Origo.ol.style.Style({
        text: new Origo.ol.style.Text({
          text: textString || 'Text',
          font,
          fill
        })
      });
      break;
    default:
      style[0] = createRegularShape(pointType, pointSize, fill, stroke);
      break;
  }
  return style;
}

function styleFeature() {
  drawHandler.getSelection().forEach((feature) => {
    const style = feature.getStyle();
    style[0] = getStylewindowStyle(feature)[0];
    feature.setStyle(style);
  });
}

function setInitialValues() {
  const fillColorEl = document.querySelector('input[name = "fillColorRadio"]:checked');
  fillColor = fillColorEl ? fillColorEl.value : 'rgb(0,153,255)';
  fillOpacity = document.getElementById('o-draw-style-fillOpacitySlider').value;
  fillColorArr = rgbToArray(fillColor, fillOpacity);
  const strokeColorEl = document.querySelector('input[name = "strokeColorRadio"]:checked');
  strokeColor = strokeColorEl ? strokeColorEl.value : 'rgb(0,153,255)';
  strokeOpacity = document.getElementById('o-draw-style-strokeOpacitySlider').value;
  strokeWidth = document.getElementById('o-draw-style-strokeWidthSlider').value;
  strokeType = document.getElementById('o-draw-style-strokeType').value;
  strokeColorArr = rgbToArray(strokeColor, strokeOpacity);
  pointSize = document.getElementById('o-draw-style-pointSizeSlider').value;
  pointType = document.getElementById('o-draw-style-pointType').value;
  textSize = document.getElementById('o-draw-style-textSizeSlider').value;
  textString = document.getElementById('o-draw-style-textString').value;
}

function bindUIActions() {
  let matches;
  const fillColorEl = document.getElementById('o-draw-style-fillColor');
  const strokeColorEl = document.getElementById('o-draw-style-strokeColor');

  matches = fillColorEl.querySelectorAll('span');
  for (let i = 0; i < matches.length; i += 1) {
    matches[i].addEventListener('click', function e() {
      setFillColor(this.style.backgroundColor);
      styleFeature();
    });
  }

  matches = strokeColorEl.querySelectorAll('span');
  for (let i = 0; i < matches.length; i += 1) {
    matches[i].addEventListener('click', function e() {
      setStrokeColor(this.style.backgroundColor);
      styleFeature();
    });
  }

  document.getElementById('o-draw-style-fillOpacitySlider').addEventListener('input', function e() {
    fillOpacity = this.value;
    setFillColor(fillColor);
    styleFeature();
  });

  document.getElementById('o-draw-style-strokeOpacitySlider').addEventListener('input', function e() {
    strokeOpacity = this.value;
    setStrokeColor(strokeColor);
    styleFeature();
  });

  document.getElementById('o-draw-style-strokeWidthSlider').addEventListener('input', function e() {
    strokeWidth = this.value;
    styleFeature();
  });

  document.getElementById('o-draw-style-strokeType').addEventListener('change', function e() {
    strokeType = this.value;
    styleFeature();
  });

  document.getElementById('o-draw-style-pointType').addEventListener('change', function e() {
    pointType = this.value;
    styleFeature();
  });

  document.getElementById('o-draw-style-pointSizeSlider').addEventListener('input', function e() {
    pointSize = this.value;
    styleFeature();
  });

  document.getElementById('o-draw-style-textString').addEventListener('input', function e() {
    textString = this.value;
    styleFeature();
  });

  document.getElementById('o-draw-style-textSizeSlider').addEventListener('input', function e() {
    textSize = this.value;
    styleFeature();
  });
}

function Stylewindow(optOptions = {}) {
  const {
    title = 'Anpassa stil',
    cls = 'control overflow-hidden hidden',
    target,
    closeIcon = '#ic_close_24px',
    style = '',
    palette = ['rgb(166,206,227)', 'rgb(31,120,180)', 'rgb(178,223,138)', 'rgb(51,160,44)', 'rgb(251,154,153)', 'rgb(227,26,28)', 'rgb(253,191,111)']
  } = optOptions;

  annotationField = optOptions.annotation || 'annotation';

  let stylewindowEl;
  let titleEl;
  let headerEl;
  let contentEl;
  let closeButton;

  palette.forEach((item, index) => {
    const colorArr = rgbToArray(palette[index]);
    palette[index] = `rgb(${colorArr[0]},${colorArr[1]},${colorArr[2]})`;
  });

  const closeWindow = function closeWindow() {
    stylewindowEl.classList.toggle('hidden');
  };

  return Origo.ui.Component({
    closeWindow,
    onInit() {
      const headerCmps = [];

      titleEl = Origo.ui.Element({
        cls: 'flex row justify-start margin-y-small margin-left text-weight-bold',
        style: 'width: 100%;',
        innerHTML: `${title}`
      });
      headerCmps.push(titleEl);

      closeButton = Origo.ui.Button({
        cls: 'small round margin-top-small margin-right-small margin-bottom-auto margin-right icon-smaller grey-lightest no-shrink',
        icon: closeIcon,
        validStates: ['initial', 'hidden'],
        click() {
          closeWindow();
        }
      });
      headerCmps.push(closeButton);

      headerEl = Origo.ui.Element({
        cls: 'flex justify-end grey-lightest',
        components: headerCmps
      });

      contentEl = Origo.ui.Element({
        cls: 'o-draw-stylewindow-content overflow-auto',
        innerHTML: `${styleTemplate(palette)}`
      });

      this.addComponent(headerEl);
      this.addComponent(contentEl);

      this.on('render', this.onRender);
      document.getElementById(target).appendChild(Origo.ui.dom.html(this.render()));
      this.dispatch('render');
      bindUIActions();
      setInitialValues();
    },
    onRender() {
      stylewindowEl = document.getElementById('o-draw-stylewindow');
    },
    render() {
      let addStyle;
      if (style !== '') {
        addStyle = `style="${style}"`;
      } else {
        addStyle = '';
      }
      return `<div id="o-draw-stylewindow" class="${cls} flex">
                  <div class="absolute flex column no-margin width-full height-full" ${addStyle}>
                    ${headerEl.render()}
                    ${contentEl.render()}
                  </div>
                </div>`;
    }
  });
}

export {
  Stylewindow,
  restoreStylewindow,
  updateStylewindow,
  getStylewindowStyle
};
