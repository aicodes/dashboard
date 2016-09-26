// The View object for ICE. Responsible for rendering ICE in dashboard.

function update(iceModel) {
  const welcomeDiv = document.getElementById('welcome-div');
  if (welcomeDiv != null) {
    welcomeDiv.outerHTML = '';
  }

  document.getElementById('ice-body').style.display = 'block';

  const intentionNode = document.getElementById('intention');
  const contextNode = document.getElementById('context');
  const extensionNode = document.getElementById('extension');
  while (intentionNode.firstChild) {
    intentionNode.removeChild(intentionNode.firstChild);
  }

  while (contextNode.firstChild) {
    contextNode.removeChild(contextNode.firstChild);
  }

  while (extensionNode.firstChild) {
    extensionNode.removeChild(extensionNode.firstChild);
  }

  intentionNode.appendChild(document.createTextNode(
        JSON.stringify(iceModel.intention, null, 2)));
  for (const item of iceModel.context) {
    contextNode.appendChild(document.createTextNode(`${item}\n`));
  }

  for (const item of iceModel.extension) {
    extensionNode.appendChild(
            document.createElement('PRE').appendChild(
                document.createElement('CODE').appendChild(
                    document.createTextNode(
                        `${JSON.stringify(item, null, 2)}\n`))));
  }
}

/*
 var plotGoogleCharts = function(usage) {
 "use strict";
 var json_usage = JSON.parse(usage);
 var data = new google.visualization.DataTable();

 data.addColumn('string', 'Method');
 data.addColumn('number', 'Frequency');

 for (var name in json_usage) {
 data.addRow([name, json_usage[name]]);
 }
 var chart = new google.visualization.BarChart(document.getElementById('chart_div'));
 var options = {
 width: 500,
 height: 800,
 bar: {groupWidth: "95%"},
 legend: 'none',
 vAxis: {
 textStyle: {
 'fontName': 'Source Code Pro',
 }
 }
 };
 chart.draw(data, options);
 };
 */

export {
    update as default,
};
