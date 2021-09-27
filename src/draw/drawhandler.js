import Origo from 'Origo';
import $ from 'jquery';
import dispatcher from './drawdispatcher';
import defaultDrawStyle from './drawstyle';
import shapes from './shapes';
import { restoreStylewindow, updateStylewindow, getStylewindowStyle } from './stylewindow';

let map;
let viewer;
let drawSource;
let drawLayer;
let draw;
let activeTool;
let select;
let modify;
let annotationField;
let Style;
let markerIcon;
let touchMode;

const selectionStyle = new Origo.ol.style.Style({
  image: new Origo.ol.style.Circle({
    radius: 6,
    fill: new Origo.ol.style.Fill({
      color: [200, 100, 100, 0.8]
    })
  }),
  geometry(feature) {
    let coords;
    let pointGeometry;
    const type = feature.getGeometry().getType();
    if (type === 'Polygon') {
      coords = feature.getGeometry().getCoordinates()[0];
      pointGeometry = new Origo.ol.geom.MultiPoint(coords);
    } else if (type === 'LineString') {
      coords = feature.getGeometry().getCoordinates();
      pointGeometry = new Origo.ol.geom.MultiPoint(coords);
    } else if (type === 'Point') {
      coords = feature.getGeometry().getCoordinates();
      pointGeometry = new Origo.ol.geom.Point(coords);
    }
    return pointGeometry;
  }
});

function disableDoubleClickZoom(evt) {
  const featureType = evt.feature.getGeometry().getType();
  const interactionsToBeRemoved = [];

  if (featureType === 'Point') {
    return;
  }

  map.getInteractions().forEach((interaction) => {
    if (interaction instanceof Origo.ol.interaction.DoubleClickZoom) {
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

function showMarker() {
  document.getElementById(`${markerIcon.getId()}`).classList.remove('hidden');
  document.getElementById('o-draw-add-node').classList.remove('hidden');
}
function hideMarker() {
  document.getElementById(`${markerIcon.getId()}`).classList.add('hidden');
  document.getElementById('o-draw-add-node').classList.add('hidden');
}

function setActive(drawType) {
  switch (drawType) {
    case 'draw':
      if (touchMode) {
        showMarker();
      }
      select.getFeatures().clear();
      modify.setActive(true);
      select.setActive(false);
      break;
    default:
      if (touchMode) {
        hideMarker();
      }
      activeTool = undefined;
      map.removeInteraction(draw);
      modify.setActive(true);
      select.setActive(true);
      break;
  }
}

function onTextEnd(feature, textVal) {
  // Remove the feature if no text is set
  if (textVal === '') {
    drawLayer.getFeatureStore().removeFeature(feature);
  } else {
    feature.set(annotationField, textVal);
  }
  setActive();
  activeTool = undefined;
  dispatcher.emitChangeDraw('Text', false);
}

function addDoubleClickZoomInteraction() {
  const allDoubleClickZoomInteractions = [];
  map.getInteractions().forEach((interaction) => {
    if (interaction instanceof Origo.ol.interaction.DoubleClickZoom) {
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
    onTextEnd(evt.feature, 'Text');
    document.getElementById('o-draw-stylewindow').classList.remove('hidden');
  } else {
    setActive();
    activeTool = undefined;
    dispatcher.emitChangeDraw(evt.feature.getGeometry().getType(), false);
  }
  enableDoubleClickZoom(evt);
  if (drawLayer) {
    const featureStyle = getStylewindowStyle(evt.feature);
    evt.feature.setStyle(featureStyle);
  }
}

function setDraw(tool, drawType) {
  let geometryType = tool;
  drawSource = drawLayer.getFeatureStore();
  activeTool = tool;

  if (activeTool === 'Text') {
    geometryType = 'Point';
  }

  const drawOptions = {
    source: drawSource,
    type: geometryType,
    condition(evt) {
      return evt.originalEvent.pointerType !== 'touch';
    }
  };

  if (drawType) {
    $.extend(drawOptions, shapes(drawType));
  }

  map.removeInteraction(draw);
  draw = new Origo.ol.interaction.Draw(drawOptions);
  map.addInteraction(draw);
  dispatcher.emitChangeDraw(tool, true);
  draw.on('drawend', onDrawEnd, this);
  draw.on('drawstart', onDrawStart, this);
}

function addNode() {
  const pixel = map.getPixelFromCoordinate(map.getView().getCenter());
  const eventObject = {
    clientX: pixel[0],
    clientY: pixel[1],
    bubbles: true
  };
  const down = new PointerEvent('pointerdown', eventObject);
  const up = new PointerEvent('pointerup', eventObject);
  map.getViewport().dispatchEvent(down);
  map.getViewport().dispatchEvent(up);
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
    const featureStyle = feature.getStyle() || Style.createStyleRule(defaultDrawStyle.draw[1]);
    featureStyle.push(selectionStyle);
    feature.setStyle(featureStyle);
    updateStylewindow(feature);
  }
}

function onSelectRemove(e) {
  restoreStylewindow();
  const style = e.element.getStyle();
  if (style[style.length - 1] === selectionStyle) {
    style.pop();
    e.element.setStyle(style);
  }
}

function cancelDraw(tool) {
  setActive();
  activeTool = undefined;
  dispatcher.emitChangeDraw(tool, false);
}

function onChangeDrawType(e) {
  activeTool = undefined;
  dispatcher.emitToggleDraw(e.tool, { drawType: e.drawType });
}

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
}

function getState() {
  if (drawLayer) {
    const source = drawLayer.getFeatureStore();
    const geojson = new Origo.ol.format.GeoJSON();
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
    if (drawLayer === undefined) {
      drawLayer = Origo.featurelayer(null, map);
    }
    const source = drawLayer.getFeatureStore();
    source.addFeatures(state.features);
    source.getFeatures().forEach((feature) => {
      if (feature.get(annotationField)) {
        feature.set(annotationField, feature.get(annotationField));
      }
      if (feature.get('style')) {
        const featureStyle = getStylewindowStyle(feature, feature.get('style'));
        feature.setStyle(featureStyle);
      } else {
        const featureStyle = getStylewindowStyle(feature);
        feature.setStyle(featureStyle);
      }
    });
  }
}

function toggleDraw(e) {
  e.stopPropagation();
  if (e.tool === 'delete') {
    onDeleteSelected();
  } else if (e.tool === 'cancel') {
    cancelDraw(e.tool);
    removeInteractions();
  } else if (e.tool === activeTool) {
    cancelDraw(e.tool);
  } else if (e.tool === 'Polygon' || e.tool === 'LineString' || e.tool === 'Point' || e.tool === 'Text') {
    if (activeTool) {
      cancelDraw(e.tool);
    }
    setActive('draw');
    setDraw(e.tool, e.drawType);
  }
}

function onEnableInteraction(e) {
  if (e.detail.interaction === 'draw' && !isActive()) {
    const drawStyle = Style.createStyleRule(defaultDrawStyle.draw);

    if (drawLayer === undefined) {
      drawLayer = Origo.featurelayer(null, map);
      drawLayer.setStyle(drawStyle);
    }
    select = new Origo.ol.interaction.Select({
      layers: [drawLayer.getFeatureLayer()],
      style: null,
      hitTolerance: 5
    });
    modify = new Origo.ol.interaction.Modify({
      features: select.getFeatures(),
      style: null
    });
    map.addInteraction(select);
    map.addInteraction(modify);
    select.getFeatures().on('add', onSelectAdd, this);
    select.getFeatures().on('remove', onSelectRemove, this);
    setActive();
    viewer.dispatch('toggleClickInteraction', { name: 'featureinfo', active: false });
    $('#o-draw-toolbar').removeClass('o-hidden');
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
const getSelection = () => select.getFeatures();

const getActiveTool = () => activeTool;

const init = function init(optOptions) {
  runPolyFill();

  const options = optOptions || {};
  Style = Origo.Style;

  map = options.viewer.getMap();

  viewer = options.viewer;
  annotationField = options.annotation || 'annonation';
  activeTool = undefined;

  touchMode = 'ontouchstart' in document.documentElement;
  if (touchMode) {
    markerIcon = Origo.ui.Icon({
      icon: '#o_centerposition_24px',
      cls: 'o-position-marker hidden'
    });
    const markerElement = Origo.ui.dom.html(markerIcon.render());
    document.getElementById(`${viewer.getId()}`).appendChild(markerElement);
  }

  $(document).on('toggleDraw', toggleDraw);
  $(document).on('editorDrawTypes', onChangeDrawType);
  $(document).on('enableInteraction', onEnableInteraction);
};

export default {
  init,
  addNode,
  getSelection,
  getState,
  restoreState,
  getActiveTool,
  isActive
};
