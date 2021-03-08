import $ from 'jquery';
import drawHandler from './drawhandler';

function emitToggleDraw(tool, optOptions) {
  const options = optOptions || {};
  const e = {
    type: 'toggleDraw',
    tool
  };
  $.extend(e, options);
  $.event.trigger(e);
}

function emitChangeDraw(tool, state) {
  $.event.trigger({
    type: 'changeDraw',
    tool,
    active: state
  });
}

function emitEnableDrawInteraction() {
  $('.o-map').first().trigger({
    type: 'enableInteraction',
    detail: {
      interaction: 'draw'
    }
  });
}

function emitDisableDrawInteraction() {
  drawHandler.getSelection().clear();
  $('.o-map').first().trigger({
    type: 'enableInteraction',
    detail: {
      interaction: 'featureinfo'
    }
  });
}

function emitChangeEditorDrawType(tool, drawType) {
  $.event.trigger({
    type: 'editorDrawTypes',
    tool,
    drawType
  });
}

export default {
  emitToggleDraw,
  emitChangeDraw,
  emitEnableDrawInteraction,
  emitDisableDrawInteraction,
  emitChangeEditorDrawType
};
