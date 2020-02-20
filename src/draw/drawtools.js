import $ from 'jquery';
import Origo from 'Origo';
import dispatcher from './drawdispatcher';

const createElement = Origo.Utils.default.createElement;

let viewer;

const drawToolsSelector = function drawToolsSelector(tools, v) {
  const toolNames = {
    Polygon: 'Polygon',
    Point: 'Punkt',
    LineString: 'Linje',
    box: 'Rektangel',
    freehand: 'Frihandsläge'
  };
  viewer = v;
  let drawTools;
  const map = viewer.getMap();
  let active = false;
  const activeCls = 'o-active';
  const target = 'draw-toolbar-dropdown';

  function selectionModel() {
    const selectOptions = drawTools.map((drawTool) => {
      const obj = {};
      obj.name = toolNames[drawTool];
      obj.value = drawTool;
      return obj;
    });
    return selectOptions;
  }

  function createDropDownOptions() {
    return {
      target,
      selectOptions: selectionModel(drawTools),
      activeTool: drawTools[0]
    };
  }

  function close() {
    if (active) {
      setActive(drawTools[0], false);
    }
  }

  function addDropDown(options) {
    Origo.dropdown(`${options.target}-${options.activeTool}`, options.selectOptions, {
      dataAttribute: 'shape',
      active: options.activeTool
    });
    $(`#${options.target}-${options.activeTool}`).on('changeDropdown', (e) => {
      e.stopImmediatePropagation(e);
      dispatcher.emitChangeEditorDrawType(options.activeTool, e.detail.dataAttribute);
      close();
    });
  }

  function setActive(tool, state) {
    if (state) {
      if (drawTools.length > 1) {
        active = true;
        $(`#${target}-${tool} > ul`).remove();
        addDropDown(createDropDownOptions());
        $(`#${target}-${tool}`).addClass(activeCls);
        map.once('click', close);
      }
    } else {
      active = false;
      $(`[id^=${target}-]`).removeClass(activeCls);
      map.un('click', close);
    }
  }

  function render() {
    for (const tool in tools) {
      if (tools.hasOwnProperty(tool)) {
        const popover = createElement('div', '', {
          id: `${target}-${tool}`,
          cls: 'o-popover'
        });
        $(`button[title=${toolNames[tool]}]`).after(popover);
        setActive(tool, false);
      }
    }
  }

  function setDrawTools(tool) {
    if (tools[tool]) {
      drawTools = tools[tool] ? tools[tool].slice(0) : [];
      drawTools.unshift(tool);
    } else {
      drawTools = [tool];
    }
  }

  function onChangeEdit(e) {
    if (e.active === true) {
      setDrawTools(e.tool);
      setActive(e.tool, true);
    } else if (e.active === false) {
      setActive(e.tool, false);
    }
    e.stopPropagation();
  }

  function addListener() {
    $(document).on('changeDraw', onChangeEdit);
  }

  function init() {
    render();
    addListener();
  }

  init();
};

export default drawToolsSelector;
