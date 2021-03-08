import $ from 'jquery';
import dispatcher from './drawdispatcher';
import drawTemplate from './drawtemplate';
import drawHandler from './drawhandler';
import drawExtraTools from './drawtools';

const activeClass = 'o-control-active';
let $drawPolygon;
let $drawLineString;
let $drawPoint;
let $drawText;
let $drawStyle;
let $drawDelete;
let $drawClose;
let drawTools;
let target;
let viewer;

function render() {
  $(`#${target}`).append(drawTemplate);
  $drawPolygon = $('#o-draw-polygon');
  $drawLineString = $('#o-draw-polyline');
  $drawPoint = $('#o-draw-point');
  $drawText = $('#o-draw-text');
  $drawStyle = $('#o-draw-style');
  $drawDelete = $('#o-draw-delete');
  $drawClose = $('#o-draw-close');
  drawTools = {
    Point: $drawPoint,
    Linje: $drawLineString,
    Polygon: $drawPolygon,
    Text: $drawText
  };
}

function bindUIActions() {
  $drawDelete.on('click', (e) => {
    dispatcher.emitToggleDraw('delete');
    $drawDelete.blur();
    e.preventDefault();
  });
  $drawPolygon.on('click', (e) => {
    dispatcher.emitToggleDraw('Polygon', true);
    $drawPolygon.blur();
    e.preventDefault();
  });
  $drawLineString.on('click', (e) => {
    dispatcher.emitToggleDraw('LineString');
    $drawLineString.blur();
    e.preventDefault();
  });
  $drawPoint.on('click', (e) => {
    dispatcher.emitToggleDraw('Point');
    $drawPoint.blur();
    e.preventDefault();
  });
  $drawText.on('click', (e) => {
    dispatcher.emitToggleDraw('Text');
    $drawText.blur();
    e.preventDefault();
  });
  $drawStyle.on('click', (e) => {
    const stylewindowEl = document.getElementById('o-draw-stylewindow');
    stylewindowEl.classList.toggle('hidden');
    $drawStyle.blur();
    e.preventDefault();
  });
  $drawClose.on('click', (e) => {
    const stylewindowEl = document.getElementById('o-draw-stylewindow');
    stylewindowEl.classList.add('hidden');
    dispatcher.emitDisableDrawInteraction();
    $drawClose.blur();
    e.stopPropagation();
    e.preventDefault();
    // For Origo to be able to react properly based on new event system
    document.dispatchEvent(new CustomEvent('toggleInteraction', {
      bubbles: true,
      detail: {
        interaction: 'featureInfo'
      }
    }));
  });
}

function setActive(state) {
  if (state === true) {
    viewer.dispatch('toggleClickInteraction', { name: 'featureinfo', active: false });
    $('#o-draw-toolbar').removeClass('o-hidden');
  } else {
    viewer.dispatch('toggleClickInteraction', { name: 'featureinfo', active: true });
    $('#o-draw-toolbar').addClass('o-hidden');
  }
}

function onEnableInteraction(e) {
  const toolbarEl = document.getElementById('o-draw-toolbar');
  if (e.detail.interaction === 'draw') {
    setActive(true);
  } else if (drawHandler.isActive() && !toolbarEl.classList.contains('o-hidden') && e.detail.interaction !== 'featureInfo') {
    const stylewindowEl = document.getElementById('o-draw-stylewindow');
    stylewindowEl.classList.add('hidden');
    toolbarEl.classList.add('o-hidden');
    drawHandler.getSelection().clear();
    dispatcher.emitToggleDraw('cancel');
  } else if (drawHandler.isActive() && !toolbarEl.classList.contains('o-hidden')) {
    const stylewindowEl = document.getElementById('o-draw-stylewindow');
    stylewindowEl.classList.add('hidden');
    drawHandler.getSelection().clear();
    dispatcher.emitToggleDraw('cancel');
    setActive(false);
  }
}

function toggleState(tool, state) {
  if (state === false) {
    tool.removeClass(activeClass);
  } else {
    tool.addClass(activeClass);
  }
}

function changeDrawState(e) {
  const tools = Object.getOwnPropertyNames(drawTools);
  tools.forEach((tool) => {
    if (tool === e.tool) {
      toggleState(drawTools[tool], e.active);
    } else {
      toggleState(drawTools[tool], false);
    }
  });
}

function getState() {
  return drawHandler.getState();
}

function restoreState(params) {
  if (params && params.controls && params.controls.draw) {
    drawHandler.restoreState(params.controls.draw);
  }
}

function init(optOptions) {
  const options = optOptions || {};
  const extraTools = options.options.drawTools;
  viewer = options.viewer;
  target = 'o-tools-bottom';
  drawHandler.init(options);
  render();
  drawExtraTools(extraTools, viewer);
  viewer.on('toggleClickInteraction', (detail) => {
    onEnableInteraction({detail});
  });
  $(document).on('enableInteraction', onEnableInteraction);
  $(document).on('changeDraw', changeDrawState);
  bindUIActions();
  if (options.isActive) {
    setActive(true);
    dispatcher.emitEnableDrawInteraction();
  }
}

export default {
  getState,
  restoreState,
  init
};
