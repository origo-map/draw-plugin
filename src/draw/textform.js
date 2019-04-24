"use strict";

const createElement = function (el, val, attributes) {
  const prefix = `<${el}`;
  const suffix = `</${el}>`;
  const attributeNames = attributes ? Object.getOwnPropertyNames(attributes) : [];
  const attributeList = attributeNames.map((name) => {
    let res = '';
    if (name === 'cls') {
      res = ` ${'class'.concat('=', '"', attributes[name], '"')}`;
    } else {
      res = ` ${name.concat('=', '"', attributes[name], '"')}`;
    }
    return res;
  });
  const element = prefix.concat(attributeList.join(' '), '>', val, suffix);
  return element;
};

const createForm = function (options) {
  var input = createElement('input', '', {
    id: 'o-draw-input-text',
    type: 'text',
    value: options.value || '',
    placeholder: options.placeHolder
  });
  var saveButton = createElement('input', '', {
    id: 'o-draw-save-text',
    type: 'button',
    value: 'Ok'
  });
  var saveWrapper = createElement('div', saveButton, {
    cls: 'o-form-save'
  });
  var content = input + '<br><br>' + saveWrapper;
  var form = createElement('form', content);
  return form;
}

export default { createForm }
