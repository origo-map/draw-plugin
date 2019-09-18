import Origo from 'Origo';
import $ from 'jquery';
import GeoJSON from 'ol/format/GeoJSON';
import dispatcher from './drawdispatcher';
import modal from './modal';
import defaultDrawStyle from './drawstyle';
import textForm from './textform';

let map;
let drawLayer;
let draw;
let activeTool;
let select;
let modify;
let annotationField;
let promptTitle;
let placeholderText;
let viewerId;
let Style;

function disableDoubleClickZoom(evt) {
  const featureType = evt.feature.getGeometry().getType();
  const interactionsToBeRemoved = [];

  if (featureType === 'Point') {
    return;
  }

  map.getInteractions().forEach((interaction) => {
    // instanceof cannot be used because ol instance in this plugin is not the same as in Origo.
    if (interaction.constructor.name === 'DoubleClickZoom') {
      interactionsToBeRemoved.push(interaction);
    }
  });
  if (interactionsToBeRemoved.length > 0) {
    map.removeInteraction(interactionsToBeRemoved[0]);
  }
}

function onDrawStart(evt) {
  if (evt.feature.getGeometry().getType() !== 'Point') {
    disableDoubleClickZoom(evt);
  }
}

function setActive(drawType) {
  switch (drawType) {
    case 'draw':
      select.getFeatures().clear();
      modify.setActive(true);
      select.setActive(false);
      break;
    default:
      activeTool = undefined;
      map.removeInteraction(draw);
      modify.setActive(true);
      select.setActive(true);
      break;
  }
}

function onTextEnd(feature, textVal) {
  const text = defaultDrawStyle.text;
  text.text.text = textVal;
  const textStyle = Style.createStyleRule([text]);
  feature.setStyle(textStyle);
  feature.set(annotationField, textVal);
  setActive();
  activeTool = undefined;
  dispatcher.emitChangeDraw('Text', false);
}

function promptText(feature) {
  const content = textForm.createForm({
    value: feature.get(annotationField) || '',
    placeHolder: placeholderText
  });
  modal.createModal(viewerId, {
    title: promptTitle,
    content
  });
  modal.showModal();
  $('#o-draw-save-text').on('click', (e) => {
    const textVal = $('#o-draw-input-text').val();
    modal.closeModal();
    $('#o-draw-save-text').blur();
    e.preventDefault();
    onTextEnd(feature, textVal);
  });
}

function addDoubleClickZoomInteraction() {
  const allDoubleClickZoomInteractions = [];
  map.getInteractions().forEach((interaction) => {
    // instanceof cannot be used because ol instance in this plugin is not the same as in Origo.
    if (interaction.constructor.name === 'DoubleClickZoom') {
      allDoubleClickZoomInteractions.push(interaction);
    }
  });
  if (allDoubleClickZoomInteractions.length < 1) {
    map.addInteraction(new Origo.ol.interaction.DoubleClickZoom());
  }
}

function enableDoubleClickZoom() {
  setTimeout(() => {
    addDoubleClickZoomInteraction();
  }, 100);
}

function onDrawEnd(evt) {
  if (activeTool === 'Text') {
    promptText(evt.feature);
  } else {
    setActive();
    activeTool = undefined;
    dispatcher.emitChangeDraw(evt.feature.getGeometry().getType(), false);
  }
  enableDoubleClickZoom(evt);
}

function setDraw(drawType) {
  let geometryType = drawType;
  activeTool = drawType;
  if (activeTool === 'Text') {
    geometryType = 'Point';
  }
  draw = new Origo.ol.interaction.Draw({
    source: drawLayer.getFeatureStore(),
    type: geometryType
  });
  map.addInteraction(draw);
  dispatcher.emitChangeDraw(drawType, true);
  draw.on('drawend', onDrawEnd, this);
  draw.on('drawstart', onDrawStart, this);
}

function onDeleteSelected() {
  const features = select.getFeatures();
  let source;
  if (features.getLength()) {
    source = drawLayer.getFeatureStore();
    features.forEach((feature) => {
      source.removeFeature(feature);
    });
    select.getFeatures().clear();
  }
}

function onSelectAdd(e) {
  let feature;
  if (e.target) {
    feature = e.target.item(0);
    if (feature.get(annotationField)) {
      promptText(feature);
    }
  }
}

function cancelDraw() {
  setActive();
  activeTool = undefined;
  dispatcher.emitChangeDraw('cancel', false);
}

/*
function isActive() {
  if (modify === undefined || select === undefined) {
    return false;
  }
  return true;
}

function removeInteractions() {
  if (isActive()) {
    map.removeInteraction(modify);
    map.removeInteraction(select);
    map.removeInteraction(draw);
    modify = undefined;
    select = undefined;
    draw = undefined;
  }
} */

function getState() {
  if (drawLayer) {
    const source = drawLayer.getFeatureStore();
    const geojson = new GeoJSON();
    const features = source.getFeatures();
    const json = geojson.writeFeatures(features);
    return {
      features: json
    };
  }

  return undefined;
}

function restoreState(state) {
  // TODO: Sanity/data check
  if (state.features && state.features.length > 0) {
    const source = drawLayer.getFeatureStore();
    source.addFeatures(state.features);
    source.getFeatures().forEach((feature) => {
      if (feature.get(annotationField)) {
        onTextEnd(feature, feature.get(annotationField));
      }
    });
  }
}

function toggleDraw(e) {
  e.stopPropagation();
  if (e.tool === 'delete') {
    onDeleteSelected();
  } else if (e.tool === 'cancel') {
    // removeInteractions();
    cancelDraw();
  } else if (e.tool === activeTool) {
    cancelDraw();
  } else if (e.tool === 'Polygon' || e.tool === 'LineString' || e.tool === 'Point' || e.tool === 'Text') {
    if (activeTool) {
      cancelDraw();
    }
    setActive('draw');
    setDraw(e.tool);
  }
}

function runPolyFill() {
  // To support Function.name for browsers that don't support it. (IE)
  if (Function.prototype.name === undefined && Object.defineProperty !== undefined) {
    Object.defineProperty(Function.prototype, 'name', {
      get() {
        const funcNameRegex = /function\s([^(]{1,})\(/;
        const results = (funcNameRegex).exec((this).toString());
        return (results && results.length > 1) ? results[1].trim() : '';
      }
    });
  }
}

const init = function init(optOptions) {
  runPolyFill();

  const options = optOptions || {};
  Style = Origo.Style;

  const drawStyle = Style.createStyleRule(defaultDrawStyle.draw);
  const selectStyle = Style.createStyleRule(defaultDrawStyle.select);
  map = options.viewer.getMap();
  viewerId = options.viewer.getMain().getId();

  annotationField = options.annonation || 'annonation';
  promptTitle = options.promptTitle || 'Ange text';
  placeholderText = options.placeholderText || 'Text som visas i kartan';
  drawLayer = Origo.featurelayer(null, map);
  drawLayer.setStyle(drawStyle);
  activeTool = undefined;

  select = new Origo.ol.interaction.Select({
    layers: [drawLayer.getFeatureLayer()],
    style: selectStyle
  });
  modify = new Origo.ol.interaction.Modify({
    features: select.getFeatures()
  });
  map.addInteraction(select);
  map.addInteraction(modify);
  select.getFeatures().on('add', onSelectAdd, this);
  setActive();
  $(document).on('toggleDraw', toggleDraw);
};

export default {
  init,
  getState,
  restoreState
};
