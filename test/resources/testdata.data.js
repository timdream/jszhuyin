'use strict';

var McBopomofoDataConverter =
  require('../../build/mcbopomofo_data_converter.js');

var converter = new McBopomofoDataConverter();
converter.convert(__dirname + '/testdata.txt', __dirname + '/testdata.data');
